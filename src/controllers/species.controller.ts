import { Response } from "express";
import { Category, Prisma, Status } from "@prisma/client";
import { prisma } from "../utils/prisma";
import { fetchWeather } from "../services/weather.service";
import { AuthRequest } from "../middlewares/auth.middleware";

const VALID_CATEGORIES = Object.values(Category);
const VALID_STATUSES = Object.values(Status);

function getQueryString(value: unknown, fallback: string): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return fallback;
}

export async function listSpecies(req: AuthRequest, res: Response): Promise<void> {
  const search = getQueryString(req.query.search, "");
  const category = getQueryString(req.query.category, "");
  const page = getQueryString(req.query.page, "1");
  const pageSize = getQueryString(req.query.pageSize, "10");

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const size = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 10));
  const skip = (pageNum - 1) * size;

  const where: Prisma.SpeciesWhereInput = {};

  if (category && VALID_CATEGORIES.includes(category as Category)) {
    where.category = category as Category;
  }

  if (search) {
    where.OR = [
      { commonName: { contains: search, mode: "insensitive" } },
      { scientificName: { contains: search, mode: "insensitive" } },
    ];
  }

  const [total, items] = await Promise.all([
    prisma.species.count({ where }),
    prisma.species.findMany({
      where,
      skip,
      take: size,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const totalPages = Math.ceil(total / size);

  res.json({
    data: items,
    total,
    page: pageNum,
    pageSize: size,
    totalPages,
    pagination: {
      total,
      page: pageNum,
      pageSize: size,
      totalPages,
    },
  });
}

export async function getSpeciesStats(_req: AuthRequest, res: Response): Promise<void> {
  const [grouped, allSpecies, statusGroups, allDates, locGroups] = await Promise.all([
    prisma.species.groupBy({ by: ["category"], _count: { id: true } }),
    prisma.species.findMany({
      select: { category: true, observationDate: true },
      where: { observationDate: { not: null } },
    }),
    prisma.species.groupBy({ by: ["status"], _count: true }),
    prisma.species.findMany({ select: { observationDate: true } }),
    prisma.species.groupBy({
      by: ["location"],
      _count: true,
      orderBy: { _count: { location: "desc" } },
      take: 8,
    }),
  ]);

  const byCategory = Object.fromEntries(
    VALID_CATEGORIES.map((cat) => [
      cat,
      grouped.find((s: { category: Category; _count: { id: number } }) => s.category === cat)?._count.id ?? 0,
    ])
  ) as Record<Category, number>;

  const total = Object.values(byCategory).reduce((a, b) => a + b, 0);

  const quarters: Record<string, { birds: number; fish: number; plants: number; mammals: number }> = {
    Q1: { birds: 0, fish: 0, plants: 0, mammals: 0 },
    Q2: { birds: 0, fish: 0, plants: 0, mammals: 0 },
    Q3: { birds: 0, fish: 0, plants: 0, mammals: 0 },
    Q4: { birds: 0, fish: 0, plants: 0, mammals: 0 },
  };

  const categoryToField: Partial<Record<Category, keyof (typeof quarters)[string]>> = {
    Bird: "birds",
    Fish: "fish",
    Plant: "plants",
    Mammal: "mammals",
  };

  for (const s of allSpecies) {
    if (!s.observationDate) continue;
    const month = new Date(s.observationDate).getMonth();
    const q = month < 3 ? "Q1" : month < 6 ? "Q2" : month < 9 ? "Q3" : "Q4";
    const field = categoryToField[s.category];
    if (field) quarters[q][field]++;
  }

  const quarterlyData = Object.entries(quarters).map(([quarter, counts]) => ({
    quarter,
    ...counts,
  }));

  const byStatus = Object.fromEntries(
    statusGroups.map((g) => [g.status ?? "Desconhecido", g._count])
  );

  const monthMap: Record<string, number> = {};
  allDates.forEach(({ observationDate }) => {
    if (!observationDate) return;
    const d = new Date(observationDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthMap[key] = (monthMap[key] ?? 0) + 1;
  });
  const byMonth = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }));

  const topLocations = locGroups
    .filter((g) => g.location)
    .map((g) => ({ location: g.location!, count: g._count }));

  res.json({ total, byCategory, quarterlyData, byStatus, byMonth, topLocations });
}

export async function getSpeciesById(req: AuthRequest, res: Response): Promise<void> {
  const id = req.params["id"] as string;
  const species = await prisma.species.findUnique({ where: { id } });

  if (!species) {
    res.status(404).json({ error: "Espécie não encontrada" });
    return;
  }

  res.json(species);
}

export async function createSpecies(req: AuthRequest, res: Response): Promise<void> {
  const {
    commonName,
    scientificName,
    category,
    latitude,
    longitude,
    location,
    observationDate,
    notes,
    status,
    abundance,
  } = req.body;

  if (!commonName || !scientificName || !category) {
    res.status(400).json({ error: "commonName, scientificName e category são obrigatórios" });
    return;
  }

  if (!VALID_CATEGORIES.includes(category)) {
    res.status(400).json({ error: `category deve ser um de: ${VALID_CATEGORIES.join(", ")}` });
    return;
  }

  if (status && !VALID_STATUSES.includes(status)) {
    res.status(400).json({ error: `status deve ser um de: ${VALID_STATUSES.join(", ")}` });
    return;
  }

  const abundanceNum = abundance != null ? Math.min(10, Math.max(1, Number(abundance))) : 1;

  let weatherData = null;
  if (latitude != null && longitude != null) {
    weatherData = await fetchWeather(Number(latitude), Number(longitude));
  }

  const species = await prisma.species.create({
    data: {
      commonName,
      scientificName,
      category: category as Category,
      latitude: latitude != null ? Number(latitude) : null,
      longitude: longitude != null ? Number(longitude) : null,
      location: location ?? null,
      observationDate: observationDate ? new Date(observationDate) : null,
      notes: notes ?? null,
      status: (status as Status) ?? Status.Active,
      abundance: abundanceNum,
      weatherData: weatherData ?? undefined,
    },
  });

  res.status(201).json(species);
}

export async function updateSpecies(req: AuthRequest, res: Response): Promise<void> {
  const id = req.params["id"] as string;
  const {
    commonName,
    scientificName,
    category,
    latitude,
    longitude,
    location,
    observationDate,
    notes,
    status,
    abundance,
  } = req.body;

  const existing = await prisma.species.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Espécie não encontrada" });
    return;
  }

  if (category && !VALID_CATEGORIES.includes(category)) {
    res.status(400).json({ error: `category deve ser um de: ${VALID_CATEGORIES.join(", ")}` });
    return;
  }

  if (status && !VALID_STATUSES.includes(status)) {
    res.status(400).json({ error: `status deve ser um de: ${VALID_STATUSES.join(", ")}` });
    return;
  }

  const latNum = latitude != null ? Number(latitude) : existing.latitude;
  const lonNum = longitude != null ? Number(longitude) : existing.longitude;

  let weatherData = existing.weatherData;
  const coordsChanged =
    latitude != null &&
    longitude != null &&
    (latNum !== existing.latitude || lonNum !== existing.longitude);

  if (coordsChanged) {
    weatherData = (await fetchWeather(latNum!, lonNum!)) ?? existing.weatherData;
  }

  const updated = await prisma.species.update({
    where: { id },
    data: {
      commonName: commonName ?? existing.commonName,
      scientificName: scientificName ?? existing.scientificName,
      category: (category as Category) ?? existing.category,
      latitude: latNum,
      longitude: lonNum,
      location: location !== undefined ? location : existing.location,
      observationDate: observationDate ? new Date(observationDate) : existing.observationDate,
      notes: notes !== undefined ? notes : existing.notes,
      status: (status as Status) ?? existing.status,
      abundance: abundance != null ? Math.min(10, Math.max(1, Number(abundance))) : existing.abundance,
      weatherData: weatherData ?? undefined,
    },
  });

  res.json(updated);
}

export async function deleteSpecies(req: AuthRequest, res: Response): Promise<void> {
  const id = req.params["id"] as string;

  const existing = await prisma.species.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Espécie não encontrada" });
    return;
  }

  await prisma.species.delete({ where: { id } });
  res.status(204).send();
}

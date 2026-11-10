import prisma from "../../../utils/prisma.js";
import { buildError, ensureOwned, toApiError, workspaceOf } from "../utils.js";

export async function listShippers(req, res, next) {
  try {
    const workspaceId = workspaceOf(req);
    const where = { workspaceId };
    if (req.query.status) where.status = req.query.status;
    if (req.query.q) {
      where.OR = [
        { name: { contains: req.query.q, mode: "insensitive" } },
        { city: { contains: req.query.q, mode: "insensitive" } },
        { contactName: { contains: req.query.q, mode: "insensitive" } },
      ];
    }
    const data = await prisma.shipper.findMany({
      where,
      include: { _count: { select: { shipments: true } } },
      orderBy: { updatedAt: "desc" },
    });
    res.json({ data });
  } catch (err) {
    next(toApiError(err));
  }
}

export async function createShipper(req, res, next) {
  try {
    const workspaceId = workspaceOf(req);
    const body = req.body || {};
    const name = String(body.name || "").trim();
    if (!name) throw buildError(400, "name is required");

    const data = await prisma.shipper.create({
      data: {
        workspaceId,
        name,
        industry: body.industry || null,
        website: body.website || null,
        city: body.city || null,
        contactName: body.contactName || null,
        contactEmail: body.contactEmail || null,
        contactPhone: body.contactPhone || null,
        status: body.status || "active",
        notes: body.notes || null,
      },
      include: { _count: { select: { shipments: true } } },
    });
    res.status(201).json({ data });
  } catch (err) {
    next(toApiError(err));
  }
}

export async function getShipper(req, res, next) {
  try {
    const workspaceId = workspaceOf(req);
    const shipper = await ensureOwned("shipper", req.params.id, workspaceId, "Shipper");
    const data = await prisma.shipper.findUnique({
      where: { id: shipper.id },
      include: {
        _count: { select: { shipments: true, activities: true } },
        shipments: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: { column: true },
        },
      },
    });
    res.json({ data });
  } catch (err) {
    next(toApiError(err));
  }
}

export async function updateShipper(req, res, next) {
  try {
    const workspaceId = workspaceOf(req);
    const shipper = await ensureOwned("shipper", req.params.id, workspaceId, "Shipper");
    const body = req.body || {};

    const data = await prisma.shipper.update({
      where: { id: shipper.id },
      data: {
        ...(body.name !== undefined && { name: String(body.name).trim() }),
        ...(body.industry !== undefined && { industry: body.industry }),
        ...(body.website !== undefined && { website: body.website }),
        ...(body.city !== undefined && { city: body.city }),
        ...(body.contactName !== undefined && { contactName: body.contactName }),
        ...(body.contactEmail !== undefined && { contactEmail: body.contactEmail }),
        ...(body.contactPhone !== undefined && { contactPhone: body.contactPhone }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.notes !== undefined && { notes: body.notes }),
      },
      include: { _count: { select: { shipments: true } } },
    });
    res.json({ data });
  } catch (err) {
    next(toApiError(err));
  }
}

export async function deleteShipper(req, res, next) {
  try {
    const workspaceId = workspaceOf(req);
    const shipper = await ensureOwned("shipper", req.params.id, workspaceId, "Shipper");
    await prisma.shipper.delete({ where: { id: shipper.id } });
    res.status(204).end();
  } catch (err) {
    next(toApiError(err));
  }
}

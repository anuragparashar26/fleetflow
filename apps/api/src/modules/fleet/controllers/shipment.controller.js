import prisma from "../../../utils/prisma.js";
import { buildError, ensureOwned, toApiError, workspaceOf } from "../utils.js";

function generateTrackingNo() {
  const stamp = Date.now().toString(36).toUpperCase();
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `TRK-${stamp}${suffix}`;
}

async function defaultBoard(workspaceId) {
  let board = await prisma.board.findFirst({
    where: { workspaceId },
    orderBy: { createdAt: "asc" },
  });
  if (board) return board;

  board = await prisma.board.create({
    data: {
      workspaceId,
      name: "Fleet Board",
      columns: {
        create: [
          { name: "Booked", position: 0, color: "#6B7280" },
          { name: "Picked Up", position: 1, color: "#3B82F6" },
          { name: "In Transit", position: 2, color: "#F59E0B" },
          { name: "Out for Delivery", position: 3, color: "#8B5CF6" },
          { name: "Delivered", position: 4, color: "#10B981" },
        ],
      },
    },
    include: { columns: true },
  });
  return board;
}

async function assertColumnInBoard(columnId, boardId) {
  const column = await prisma.columnStatus.findUnique({ where: { id: columnId } });
  if (!column || column.boardId !== boardId) throw buildError(404, "Column not found");
  return column;
}

async function assertDriversInWorkspace(driverIds, workspaceId) {
  if (!driverIds?.length) return [];
  const drivers = await prisma.driver.findMany({
    where: { id: { in: driverIds }, workspaceId },
    select: { id: true },
  });
  if (drivers.length !== new Set(driverIds).size) {
    throw buildError(400, "One or more drivers are not in this workspace");
  }
  return drivers.map((d) => d.id);
}

const shipmentInclude = {
  column: true,
  shipper: true,
  trip: { include: { driver: true, vehicle: true } },
  items: true,
  labels: { include: { label: true } },
  drivers: { include: { driver: true } },
  _count: { select: { comments: true, activities: true } },
};

export async function listShipments(req, res, next) {
  try {
    const workspaceId = workspaceOf(req);
    const where = { workspaceId };
    if (req.query.column_id) where.columnId = req.query.column_id;
    if (req.query.shipper_id) where.shipperId = req.query.shipper_id;
    if (req.query.priority) where.priority = req.query.priority;
    if (req.query.q) {
      where.OR = [
        { title: { contains: req.query.q, mode: "insensitive" } },
        { trackingNo: { contains: req.query.q, mode: "insensitive" } },
        { origin: { contains: req.query.q, mode: "insensitive" } },
        { destination: { contains: req.query.q, mode: "insensitive" } },
      ];
    }
    const data = await prisma.shipment.findMany({
      where,
      include: shipmentInclude,
      orderBy: [{ position: "asc" }, { createdAt: "desc" }],
    });
    res.json({ data });
  } catch (err) {
    next(toApiError(err));
  }
}

export async function createShipment(req, res, next) {
  try {
    const workspaceId = workspaceOf(req);
    const body = req.body || {};

    if (!body.title?.trim()) throw buildError(400, "title is required");
    if (!body.origin?.trim()) throw buildError(400, "origin is required");
    if (!body.destination?.trim()) throw buildError(400, "destination is required");

    let boardId = body.boardId;
    if (boardId) {
      const board = await ensureOwned("board", boardId, workspaceId, "Board");
      boardId = board.id;
    } else {
      boardId = (await defaultBoard(workspaceId)).id;
    }

    let columnId = body.columnId || null;
    if (columnId) await assertColumnInBoard(columnId, boardId);

    if (body.shipperId) await ensureOwned("shipper", body.shipperId, workspaceId, "Shipper");
    if (body.tripId) await ensureOwned("trip", body.tripId, workspaceId, "Trip");
    const driverIds = await assertDriversInWorkspace(body.driverIds, workspaceId);

    const position = await prisma.shipment.count({ where: { boardId, columnId } });

    const data = await prisma.shipment.create({
      data: {
        workspaceId,
        boardId,
        columnId,
        shipperId: body.shipperId || null,
        tripId: body.tripId || null,
        trackingNo: body.trackingNo?.trim() || generateTrackingNo(),
        title: body.title.trim(),
        description: body.description || null,
        origin: body.origin.trim(),
        destination: body.destination.trim(),
        priority: body.priority || "normal",
        position,
        weightKg: body.weightKg ?? null,
        declaredValue: body.declaredValue ?? null,
        codAmount: body.codAmount ?? null,
        pickupAt: body.pickupAt ? new Date(body.pickupAt) : null,
        deliveryDueAt: body.deliveryDueAt ? new Date(body.deliveryDueAt) : null,
        createdBy: req.fleet.userId,
        items: body.items?.length
          ? {
              create: body.items.map((item) => ({
                description: String(item.description || "Item"),
                quantity: Number(item.quantity) || 1,
                weightKg: item.weightKg ?? null,
                declaredValue: item.declaredValue ?? null,
              })),
            }
          : undefined,
        drivers: driverIds.length
          ? { create: driverIds.map((driverId) => ({ driverId })) }
          : undefined,
      },
      include: shipmentInclude,
    });

    res.status(201).json({ data });
  } catch (err) {
    next(toApiError(err));
  }
}

export async function getShipment(req, res, next) {
  try {
    const workspaceId = workspaceOf(req);
    const shipment = await ensureOwned("shipment", req.params.id, workspaceId, "Shipment");
    const data = await prisma.shipment.findUnique({
      where: { id: shipment.id },
      include: {
        ...shipmentInclude,
        board: true,
        comments: {
          include: { author: { select: { id: true, fullName: true, email: true, username: true } } },
          orderBy: { createdAt: "asc" },
        },
        statusHistory: {
          include: { toColumn: true },
          orderBy: { movedAt: "desc" },
          take: 25,
        },
        activities: { orderBy: { createdAt: "desc" }, take: 25 },
      },
    });
    res.json({ data });
  } catch (err) {
    next(toApiError(err));
  }
}

export async function updateShipment(req, res, next) {
  try {
    const workspaceId = workspaceOf(req);
    const shipment = await ensureOwned("shipment", req.params.id, workspaceId, "Shipment");
    const body = req.body || {};

    if (body.boardId) await ensureOwned("board", body.boardId, workspaceId, "Board");
    if (body.columnId) await assertColumnInBoard(body.columnId, body.boardId || shipment.boardId);
    if (body.shipperId) await ensureOwned("shipper", body.shipperId, workspaceId, "Shipper");
    if (body.tripId) await ensureOwned("trip", body.tripId, workspaceId, "Trip");
    const driverIds =
      body.driverIds !== undefined
        ? await assertDriversInWorkspace(body.driverIds, workspaceId)
        : undefined;

    const data = {
      ...(body.title !== undefined && { title: String(body.title).trim() }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.origin !== undefined && { origin: body.origin }),
      ...(body.destination !== undefined && { destination: body.destination }),
      ...(body.priority !== undefined && { priority: body.priority }),
      ...(body.boardId !== undefined && { boardId: body.boardId }),
      ...(body.columnId !== undefined && { columnId: body.columnId }),
      ...(body.shipperId !== undefined && { shipperId: body.shipperId }),
      ...(body.tripId !== undefined && { tripId: body.tripId }),
      ...(body.weightKg !== undefined && { weightKg: body.weightKg }),
      ...(body.declaredValue !== undefined && { declaredValue: body.declaredValue }),
      ...(body.codAmount !== undefined && { codAmount: body.codAmount }),
      ...(body.pickupAt !== undefined && { pickupAt: body.pickupAt ? new Date(body.pickupAt) : null }),
      ...(body.deliveryDueAt !== undefined && {
        deliveryDueAt: body.deliveryDueAt ? new Date(body.deliveryDueAt) : null,
      }),
    };

    if (Array.isArray(body.items)) {
      data.items = {
        deleteMany: {},
        create: body.items.map((item) => ({
          description: String(item.description || "Item"),
          quantity: Number(item.quantity) || 1,
          weightKg: item.weightKg ?? null,
          declaredValue: item.declaredValue ?? null,
        })),
      };
    }

    if (Array.isArray(body.labelNames)) {
      data.labels = {
        deleteMany: {},
        create: body.labelNames
          .map((name) => String(name || "").trim())
          .filter(Boolean)
          .map((name) => ({
            label: {
              connectOrCreate: {
                where: { workspaceId_name: { workspaceId, name } },
                create: { workspaceId, name, color: "#4F46E5" },
              },
            },
          })),
      };
    }

    if (driverIds !== undefined) {
      data.drivers = {
        deleteMany: {},
        create: driverIds.map((driverId) => ({ driverId })),
      };
    }

    const updated = await prisma.shipment.update({ where: { id: shipment.id }, data });
    const full = await prisma.shipment.findUnique({
      where: { id: updated.id },
      include: shipmentInclude,
    });
    res.json({ data: full });
  } catch (err) {
    next(toApiError(err));
  }
}

export async function moveShipment(req, res, next) {
  try {
    const workspaceId = workspaceOf(req);
    const shipment = await ensureOwned("shipment", req.params.id, workspaceId, "Shipment");
    const { columnId, position } = req.body || {};
    if (!columnId) throw buildError(400, "columnId is required");

    const column = await assertColumnInBoard(columnId, shipment.boardId);

    const data = await prisma.$transaction(async (tx) => {
      if (position === undefined || position === null) {
        const nextPosition = await tx.shipment.count({
          where: { boardId: shipment.boardId, columnId },
        });
        const updated = await tx.shipment.update({
          where: { id: shipment.id },
          data: { columnId, position: nextPosition },
        });
        await tx.shipmentStatusHistory.create({
          data: {
            shipmentId: shipment.id,
            fromColumnId: shipment.columnId,
            toColumnId: column.id,
            movedBy: req.fleet.userId,
          },
        });
        return updated;
      }

      const target = Math.max(0, Number(position));
      await tx.shipment.updateMany({
        where: {
          boardId: shipment.boardId,
          columnId,
          position: { gte: target },
          id: { not: shipment.id },
        },
        data: { position: { increment: 1 } },
      });
      const updated = await tx.shipment.update({
        where: { id: shipment.id },
        data: { columnId, position: target },
      });
      await tx.shipmentStatusHistory.create({
        data: {
          shipmentId: shipment.id,
          fromColumnId: shipment.columnId,
          toColumnId: column.id,
          movedBy: req.fleet.userId,
        },
      });
      return updated;
    });

    res.json({ data });
  } catch (err) {
    next(toApiError(err));
  }
}

export async function deleteShipment(req, res, next) {
  try {
    const workspaceId = workspaceOf(req);
    const shipment = await ensureOwned("shipment", req.params.id, workspaceId, "Shipment");
    await prisma.shipment.delete({ where: { id: shipment.id } });
    res.status(204).end();
  } catch (err) {
    next(toApiError(err));
  }
}

export async function addShipmentComment(req, res, next) {
  try {
    const workspaceId = workspaceOf(req);
    const shipment = await ensureOwned("shipment", req.params.id, workspaceId, "Shipment");
    const body = String(req.body?.body || "").trim();
    if (!body) throw buildError(400, "body is required");

    const data = await prisma.comment.create({
      data: { shipmentId: shipment.id, authorId: req.fleet.userId, body },
      include: {
        author: { select: { id: true, fullName: true, email: true, username: true } },
      },
    });
    res.status(201).json({ data });
  } catch (err) {
    next(toApiError(err));
  }
}

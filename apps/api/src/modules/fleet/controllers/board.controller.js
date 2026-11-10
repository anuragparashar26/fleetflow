import prisma from "../../../utils/prisma.js";
import { buildError, ensureOwned, toApiError, workspaceOf } from "../utils.js";

const DEFAULT_COLUMNS = [
  { name: "Booked", color: "#6B7280" },
  { name: "Picked Up", color: "#3B82F6" },
  { name: "In Transit", color: "#F59E0B" },
  { name: "Out for Delivery", color: "#8B5CF6" },
  { name: "Delivered", color: "#10B981" },
];

export async function listBoards(req, res, next) {
  try {
    const workspaceId = workspaceOf(req);
    const data = await prisma.board.findMany({
      where: { workspaceId },
      include: {
        columns: { orderBy: { position: "asc" } },
        _count: { select: { shipments: true } },
      },
      orderBy: { createdAt: "asc" },
    });
    res.json({ data });
  } catch (err) {
    next(toApiError(err));
  }
}

export async function createBoard(req, res, next) {
  try {
    const workspaceId = workspaceOf(req);
    const body = req.body || {};
    const name = String(body.name || "").trim();
    if (!name) throw buildError(400, "name is required");

    const columns = Array.isArray(body.columns) && body.columns.length ? body.columns : DEFAULT_COLUMNS;

    const data = await prisma.board.create({
      data: {
        workspaceId,
        name,
        type: body.type || "kanban",
        columns: {
          create: columns.map((column, index) => ({
            name: String(column.name || `Stage ${index + 1}`),
            color: column.color || "#6B7280",
            position: column.position ?? index,
          })),
        },
      },
      include: { columns: { orderBy: { position: "asc" } } },
    });
    res.status(201).json({ data });
  } catch (err) {
    next(toApiError(err));
  }
}

export async function updateBoard(req, res, next) {
  try {
    const workspaceId = workspaceOf(req);
    const board = await ensureOwned("board", req.params.id, workspaceId, "Board");
    const body = req.body || {};

    const data = await prisma.$transaction(async (tx) => {
      if (body.name !== undefined) {
        const name = String(body.name).trim();
        if (!name) throw buildError(400, "name cannot be empty");
        await tx.board.update({ where: { id: board.id }, data: { name } });
      }

      if (Array.isArray(body.columns)) {
        const seenIds = body.columns.filter((column) => column.id).map((column) => column.id);
        const existing = await tx.columnStatus.findMany({
          where: { boardId: board.id },
          select: { id: true },
        });
        const existingIds = existing.map((column) => column.id);

        for (const column of body.columns) {
          if (column.id && !existingIds.includes(column.id)) {
            throw buildError(400, "One or more columns do not belong to this board");
          }
        }

        await tx.columnStatus.deleteMany({
          where: { boardId: board.id, id: { notIn: seenIds } },
        });

        for (const [index, column] of body.columns.entries()) {
          const payload = {
            name: String(column.name || `Stage ${index + 1}`),
            color: column.color || "#6B7280",
            position: column.position ?? index,
          };
          if (column.id) {
            await tx.columnStatus.update({ where: { id: column.id }, data: payload });
          } else {
            await tx.columnStatus.create({ data: { ...payload, boardId: board.id } });
          }
        }
      }

      return tx.board.findUnique({
        where: { id: board.id },
        include: { columns: { orderBy: { position: "asc" } } },
      });
    });

    res.json({ data });
  } catch (err) {
    next(toApiError(err));
  }
}

export async function deleteBoard(req, res, next) {
  try {
    const workspaceId = workspaceOf(req);
    const board = await ensureOwned("board", req.params.id, workspaceId, "Board");
    const others = await prisma.board.count({ where: { workspaceId } });
    if (others <= 1) throw buildError(400, "Cannot delete the last board in a workspace");
    await prisma.board.delete({ where: { id: board.id } });
    res.status(204).end();
  } catch (err) {
    next(toApiError(err));
  }
}

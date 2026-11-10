import express from "express";
import authMiddleware from "../../../middleware/auth.middleware.js";
import prisma from "../../../utils/prisma.js";
import {
  fleetContext,
  requireRoles,
  OPERATOR_ROLES,
  MANAGER_ROLES,
  toApiError,
  workspaceOf,
} from "../utils.js";

import * as shipments from "../controllers/shipment.controller.js";
import * as boards from "../controllers/board.controller.js";
import * as shippers from "../controllers/shipper.controller.js";
import * as vehicles from "../controllers/vehicle.controller.js";
import * as drivers from "../controllers/driver.controller.js";
import * as routes from "../controllers/route.controller.js";
import * as trips from "../controllers/trip.controller.js";
import * as activities from "../controllers/activity.controller.js";
import * as payouts from "../controllers/payout.controller.js";

const router = express.Router();

router.use(authMiddleware);
router.use(fleetContext);

const canOperate = requireRoles(...OPERATOR_ROLES);
const canManage = requireRoles(...MANAGER_ROLES);

// ---------------------------------------------------------------------------
// Module info & dashboard
// ---------------------------------------------------------------------------

router.get("/", (_req, res) => {
  res.json({
    data: {
      module: "fleet",
      description: "Logistics & fleet operations API",
      resources: [
        "shipments",
        "boards",
        "shippers",
        "vehicles",
        "drivers",
        "routes",
        "trips",
        "activities",
        "payouts",
      ],
    },
  });
});

router.get("/dashboard", async (req, res, next) => {
  try {
    const workspaceId = workspaceOf(req);
    const now = new Date();
    const in24h = new Date(now.getTime() + 86400000);

    const [
      columns,
      totalShipments,
      dueSoonShipments,
      activeTrips,
      tripsByStatus,
      vehiclesByStatus,
      driversByStatus,
      pendingPayouts,
      openActivities,
      recentActivities,
    ] = await Promise.all([
      prisma.columnStatus.findMany({
        where: { board: { workspaceId } },
        include: { _count: { select: { shipments: true } } },
        orderBy: { position: "asc" },
      }),
      prisma.shipment.count({ where: { workspaceId } }),
      prisma.shipment.count({
        where: { workspaceId, deliveryDueAt: { lte: in24h } },
      }),
      prisma.trip.count({ where: { workspaceId, status: "in_transit" } }),
      prisma.trip.groupBy({ by: ["status"], where: { workspaceId }, _count: true }),
      prisma.vehicle.groupBy({ by: ["status"], where: { workspaceId }, _count: true }),
      prisma.driver.groupBy({ by: ["status"], where: { workspaceId }, _count: true }),
      prisma.driverPayout.count({
        where: { workspaceId, status: { in: ["draft", "approved"] } },
      }),
      prisma.activity.count({ where: { workspaceId, isCompleted: false } }),
      prisma.activity.findMany({
        where: { workspaceId },
        orderBy: { createdAt: "desc" },
        take: 8,
        include: {
          shipment: { select: { id: true, trackingNo: true, title: true } },
          vehicle: { select: { id: true, regNumber: true } },
          driver: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
    ]);

    res.json({
      data: {
        shipments: {
          total: totalShipments,
          dueSoon: dueSoonShipments,
          byColumn: columns.map((column) => ({
            columnId: column.id,
            name: column.name,
            color: column.color,
            count: column._count.shipments,
          })),
        },
        trips: {
          active: activeTrips,
          byStatus: tripsByStatus.map((row) => ({ status: row.status, count: row._count })),
        },
        vehicles: {
          byStatus: vehiclesByStatus.map((row) => ({ status: row.status, count: row._count })),
        },
        drivers: {
          byStatus: driversByStatus.map((row) => ({ status: row.status, count: row._count })),
        },
        payouts: { pending: pendingPayouts },
        activities: { open: openActivities, recent: recentActivities },
      },
    });
  } catch (err) {
    next(toApiError(err));
  }
});

// ---------------------------------------------------------------------------
// Shipments (7)
// ---------------------------------------------------------------------------

router.get("/shipments", shipments.listShipments);
router.post("/shipments", canOperate, shipments.createShipment);
router.get("/shipments/:id", shipments.getShipment);
router.put("/shipments/:id", canOperate, shipments.updateShipment);
router.patch("/shipments/:id/move", canOperate, shipments.moveShipment);
router.post("/shipments/:id/comments", canOperate, shipments.addShipmentComment);
router.delete("/shipments/:id", canManage, shipments.deleteShipment);

// ---------------------------------------------------------------------------
// Boards (4) — columns are managed nested under boards
// ---------------------------------------------------------------------------

router.get("/boards", boards.listBoards);
router.post("/boards", canOperate, boards.createBoard);
router.put("/boards/:id", canOperate, boards.updateBoard);
router.delete("/boards/:id", canManage, boards.deleteBoard);

// ---------------------------------------------------------------------------
// Shippers (5)
// ---------------------------------------------------------------------------

router.get("/shippers", shippers.listShippers);
router.post("/shippers", canOperate, shippers.createShipper);
router.get("/shippers/:id", shippers.getShipper);
router.put("/shippers/:id", canOperate, shippers.updateShipper);
router.delete("/shippers/:id", canManage, shippers.deleteShipper);

// ---------------------------------------------------------------------------
// Vehicles (7) — incl. fuel log & service records
// ---------------------------------------------------------------------------

router.get("/vehicles", vehicles.listVehicles);
router.post("/vehicles", canOperate, vehicles.createVehicle);
router.get("/vehicles/:id", vehicles.getVehicle);
router.put("/vehicles/:id", canOperate, vehicles.updateVehicle);
router.delete("/vehicles/:id", canManage, vehicles.deleteVehicle);
router.post("/vehicles/:id/fuel", canOperate, vehicles.addFuelRecord);
router.post("/vehicles/:id/services", canOperate, vehicles.addServiceRecord);

// ---------------------------------------------------------------------------
// Drivers (5)
// ---------------------------------------------------------------------------

router.get("/drivers", drivers.listDrivers);
router.post("/drivers", canOperate, drivers.createDriver);
router.get("/drivers/:id", drivers.getDriver);
router.put("/drivers/:id", canOperate, drivers.updateDriver);
router.delete("/drivers/:id", canManage, drivers.deleteDriver);

// ---------------------------------------------------------------------------
// Routes (5) — stops are managed nested under routes
// ---------------------------------------------------------------------------

router.get("/routes", routes.listRoutes);
router.post("/routes", canOperate, routes.createRoute);
router.get("/routes/:id", routes.getRoute);
router.put("/routes/:id", canOperate, routes.updateRoute);
router.delete("/routes/:id", canManage, routes.deleteRoute);

// ---------------------------------------------------------------------------
// Trips (4)
// ---------------------------------------------------------------------------

router.get("/trips", trips.listTrips);
router.post("/trips", canOperate, trips.createTrip);
router.put("/trips/:id", canOperate, trips.updateTrip);
router.delete("/trips/:id", canManage, trips.deleteTrip);

// ---------------------------------------------------------------------------
// Activities (3)
// ---------------------------------------------------------------------------

router.get("/activities", activities.listActivities);
router.post("/activities", canOperate, activities.createActivity);
router.delete("/activities/:id", canOperate, activities.deleteActivity);

// ---------------------------------------------------------------------------
// Driver payouts (3) — financial records require manager role
// ---------------------------------------------------------------------------

router.get("/payouts", payouts.listPayouts);
router.post("/payouts", canManage, payouts.createPayout);
router.put("/payouts/:id", canManage, payouts.updatePayout);

export default router;

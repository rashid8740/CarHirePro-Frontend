import express from 'express';
import { 
  addVehicle, 
  getAllVehicles, 
  getVehicleById, 
  updateVehicleStatus,
  updateVehicle, 
  deleteVehicle 
} from '../controllers/vehicleController.js';

const router = express.Router();

// POST /api/vehicles - Add new vehicle
router.post('/', addVehicle);

// GET /api/vehicles - Fetch all vehicles
router.get('/', getAllVehicles);

// GET /api/vehicles/:id - Get single vehicle by ID
router.get('/:id', getVehicleById);

// PATCH /api/vehicles/:id/status - Update only vehicle status
router.patch('/:id/status', updateVehicleStatus);

// PUT /api/vehicles/:id - Update vehicle
router.put('/:id', updateVehicle);

// DELETE /api/vehicles/:id - Delete vehicle
router.delete('/:id', deleteVehicle);

export default router;

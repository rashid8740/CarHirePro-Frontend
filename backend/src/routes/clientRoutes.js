import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';
import {
  addClient,
  getAllClients,
  getClientById,
  updateClient,
  deleteClient,
  updateClientStatus,
  getClientsByStatus
} from '../controllers/clientController.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// POST /api/clients - Add new client
router.post('/', addClient);

// GET /api/clients - Fetch all clients
router.get('/', getAllClients);

// GET /api/clients/filter?status=ACTIVE|SUSPENDED - Get clients by status
router.get('/filter', getClientsByStatus);

// GET /api/clients/:id - Get single client by ID
router.get('/:id', getClientById);

// PUT /api/clients/:id - Update client
router.put('/:id', updateClient);

// DELETE /api/clients/:id - Delete client
router.delete('/:id', deleteClient);

// PUT /api/clients/:id/status - Update client status (Admin only)
router.put('/:id/status', authorize('Director', 'Owner', 'Staff'), updateClientStatus);

export default router;

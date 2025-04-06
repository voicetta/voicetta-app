import { Router } from 'express';
import { ReservationController } from '../controllers/reservation.controller';

const router = Router();
const reservationController = new ReservationController();

// GET /api/reservations - Get all reservations
router.get('/', reservationController.getAllReservations);

// GET /api/reservations/:id - Get reservation by ID
router.get('/:id', reservationController.getReservationById);

// POST /api/reservations - Create new reservation
router.post('/', reservationController.createReservation);

// POST /api/reservations/ai-agent - Create reservation from AI agent and push to YieldPlanet
router.post('/ai-agent', reservationController.createAIAgentReservation);

// PUT /api/reservations/:id - Update reservation
router.put('/:id', reservationController.updateReservation);

// POST /api/reservations/:id/cancel - Cancel reservation
router.post('/:id/cancel', reservationController.cancelReservation);

export default router;

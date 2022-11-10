import OnoffController from '../app/controllers/OnoffControllers.js';
import express from 'express';

const router = express.Router();
const onoffController = new OnoffController();

router.get('/:type', onoffController.index);

export default router;

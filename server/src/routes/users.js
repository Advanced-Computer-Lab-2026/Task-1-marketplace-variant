import { Router } from 'express';
import {
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser
} from '../controllers/userController.js';

const router = Router();

router.get('/', getAllUsers);
router.get('/:id', getUser);
router.post('/', createUser);
router.patch('/:id', updateUser);//patch(only changes one attribute) = put(changes the whole query)
router.delete('/:id', deleteUser);

export default router;

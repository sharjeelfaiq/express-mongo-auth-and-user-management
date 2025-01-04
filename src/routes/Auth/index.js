import { express } from '#packages/index.js';
import { AuthController } from '#controllers/index.js';
import { validate } from '#middlewares/index.js';
import { signUpSchema, signInSchema } from '#validations/index.js';

const authRoutes = express.Router();

authRoutes
  .post('/signup', validate.authPayload(signUpSchema), AuthController.signUp)
  .post('/signin', validate.authPayload(signInSchema), AuthController.signIn)
  .post('/signout', validate.authToken, AuthController.signOut);

export default authRoutes;
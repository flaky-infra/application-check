import express from 'express';
import {newApplicationRouter} from './routes/createApplication';

const app = express();
app.set('trust proxy', true);
app.use(express.json());
app.use('/api', newApplicationRouter);

export {app};

import express from 'express';
import {newApplicationRouter} from './routes/createApplication';
import {getTestRun} from './routes/getTestRun';

const app = express();
app.set('trust proxy', true);
app.use(express.json());
app.use('/api', newApplicationRouter);
app.use('/api', getTestRun);

export {app};

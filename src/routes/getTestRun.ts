import {mongoose} from '@typegoose/typegoose';
import express, {Request, Response} from 'express';
import {TestRunModel} from 'flaky-common';
const router = express.Router();

router.get('/testRun/:testRunId', async (req: Request, res: Response) => {
  const {testRunId} = req.params;

  const testRun = await TestRunModel.findById(
    new mongoose.Types.ObjectId(testRunId)
  );

  res.json({
    message: 'success',
    data: {
      testRun,
    },
  });
});

export {router as getTestRun};

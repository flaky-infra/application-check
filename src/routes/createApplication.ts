import express, {Request, Response} from 'express';
import multer from 'multer';
import {promisify} from 'util';
import fs from 'fs';
import {
  Application,
  ApplicationModel,
  brokerWrapper,
  ProjectReadyPublisher,
  TestRun,
  TestRunModel,
} from 'flaky-common';
import {ProjectNewPublisher} from '../messages/publishers/project-new-publisher';
import {mongoose} from '@typegoose/typegoose';
const exec = promisify(require('child_process').exec);

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, '/projects/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.originalname + '-' + uniqueSuffix);
  },
});

const upload = multer({storage});

router.post(
  '/application',
  upload.single('projectFile'),
  async (req: Request, res: Response) => {
    if (!req.file) throw new Error('File Not Found');
    const {commitId, testMethodName, configurationFolder, moduleName} =
      req.body;
    let name = req.body.name;
    if (moduleName !== '.') name += '-' + moduleName.replace('/', '-');
    name = name.toLowerCase();
    const dirName = req.file.path.replace('.tar.gz', '');
    await exec(
      `mkdir ${dirName} && tar -xvf ${req.file.path} -C ${dirName} --strip-components 1`,
      {maxBuffer: 1024 * 1024 * 1024}
    );
    fs.unlinkSync(req.file.path);

    const testRun: TestRun = {
      testMethodName,
      configFolderPath: configurationFolder,
    };
    const newTestRun = await TestRunModel.create(testRun);

    const existingApplication = await ApplicationModel.findOne({
      name,
      commitId,
      moduleName,
    });

    if (existingApplication) {
      existingApplication.testRuns!.push(newTestRun._id);
      existingApplication.save();
      new ProjectReadyPublisher(brokerWrapper).publish({
        projectId: existingApplication._id,
        testRunId: newTestRun._id,
        name,
        commitId,
        projectPath: existingApplication.projectPath,
        testMethodName,
        configurationFolder,
        moduleName,
      });
      res.json({
        message: 'success',
        data: {
          projectId: existingApplication._id,
          testRunId: newTestRun._id,
        },
      });
    } else {
      const newProject: Application = {
        name,
        projectPath: dirName,
        commitId,
        testRuns: [newTestRun._id],
        moduleName,
      };
      if (req.body.gitUrl) {
        newProject.gitUrl = req.body.gitUrl;
      }
      const newApp = await ApplicationModel.create(newProject);
      new ProjectNewPublisher(brokerWrapper).publish({
        projectId: newApp._id,
        testRunId: newTestRun._id,
        projectPath: newApp.projectPath,
        name: newApp.name,
        commitId: newApp.commitId,
        testMethodName,
        configurationFolder,
        moduleName,
      });
      res.json({
        message: 'success',
        data: {
          projectId: newApp._id,
          testRunId: newTestRun._id,
        },
      });
    }
  }
);

export {router as newApplicationRouter};

import express, {Request, Response} from 'express';
import {Application, ApplicationModel} from '../models/application';
import multer from 'multer';
import {promisify} from 'util';
import fs from 'fs';
import {brokerWrapper, ProjectNewRequestPublisher} from 'flaky-common';
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
    if (!req.file) throw new Error('File not found');
    const dirName = req.file.path.replace('.tar.gz', '');
    const {stdout, err} = await exec(
      `mkdir ${dirName} && tar -xvf ${req.file.path} -C ${dirName} --strip-components 1`
    );
    fs.unlinkSync(req.file.path);
    const newProject: Application = {
      name: req.body.name,
      version: req.body.version,
      projectPath: dirName,
      testMethodName: req.body.testMethodName,
    };
    if (req.body.gitUrl) {
      newProject.gitUrl = req.body.gitUrl;
      newProject.commitId = req.body.commitId;
    }
    const newApp = await ApplicationModel.create(newProject);
    new ProjectNewRequestPublisher(brokerWrapper).publish({
      id: newApp.id,
      projectPath: newApp.projectPath,
      name: newApp.name,
      version: newApp.version,
    });
    res.json({
      message: 'success',
      data: {
        application: newApp,
      },
    });
  }
);

export {router as newApplicationRouter};

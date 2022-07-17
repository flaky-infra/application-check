import {getModelForClass, prop} from '@typegoose/typegoose';

export class Application {
  @prop({required: true})
  public name!: string;
  @prop({required: true})
  public projectPath!: string;
  @prop({required: true})
  public testMethodName!: string;
  @prop()
  public gitUrl?: string;
  @prop()
  public commitId?: string;
  @prop({required: true})
  public version!: number;
}

export const ApplicationModel = getModelForClass(Application);

import { prop, getModelForClass, mongoose, modelOptions } from '@typegoose/typegoose';

mongoose.connect('mongodb://undefined:oekqkQo8Oa1XXtbe@db.up1.dev:32768/data', {
  authSource: 'admin',
  useNewUrlParser: true,
  useUnifiedTopology: true
})

@modelOptions({ schemaOptions: { collection: 'dropper' } })
export class FileClass {
  @prop()
  _id: string

  @prop()
  filename: string

  @prop()
  length?: number

  @prop({ default: 0 })
  downloads?: number
}

export const fileModel = getModelForClass(FileClass, { schemaOptions: { _id: false } })
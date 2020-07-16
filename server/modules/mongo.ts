import { prop, getModelForClass, mongoose, modelOptions } from '@typegoose/typegoose';

mongoose.connect('mongodb://undefined:oekqkQo8Oa1XXtbe@db.up1.dev:32768/data', {
  authSource: 'admin',
  useNewUrlParser: true,
  useUnifiedTopology: true
})

@modelOptions({ schemaOptions: { collection: 'dropper' } })
export class PostClass {
  @prop()
  _id: string

  @prop()
  filename: string

  @prop({ default: 0 })
  downloads?: number
}

export const postModel = getModelForClass(PostClass, { schemaOptions: { _id: false } })
import { ObjectId } from "mongodb";

export interface Archive {
  _id?: ObjectId;
  name: String;
  description?: string;
  createdDate: Date;
  lastModifiedDate: Date;
  createdBy: ObjectId;
}

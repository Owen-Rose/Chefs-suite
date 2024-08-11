import { ObjectId } from "mongodb";
import { Recipe } from "./Recipe";

export interface Archive {
  _id?: ObjectId;
  name: String;
  description?: string;
  createdDate: Date;
  lastModifiedDate: Date;
  createdBy: ObjectId;
  recipes: (Recipe & { archivedDate: Date; originalId: ObjectId })[];
}

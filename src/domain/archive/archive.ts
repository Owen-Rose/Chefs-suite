import { ObjectId } from 'mongodb';

export interface Archive {
  _id?: ObjectId;
  name: string;
  description?: string;
  createdDate: Date;
  lastModifiedDate: Date;
  createdBy: ObjectId;
  recipes: ({ archivedDate: Date; originalId: ObjectId } & Record<string, any>)[];
} 
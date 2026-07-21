import mongoose, { Schema, Document } from 'mongoose';

export interface IKnowledgeWikiLinkSubDoc {
  title: string;
  url?: string;
}

export interface IKnowledgeDocument extends Document {
  _id: mongoose.Types.ObjectId;
  category: string;
  title: string;
  content: string;
  wikiLinks: IKnowledgeWikiLinkSubDoc[];
  metadata: {
    hierarchyLevel: string;
    tags: string[];
    createdBy: mongoose.Types.ObjectId | string;
    updatedBy?: mongoose.Types.ObjectId | string;
    lastVerified?: Date;
    productId?: mongoose.Types.ObjectId | string;
  };
  status: string;
  isActive: boolean;
  createdBy?: mongoose.Types.ObjectId | string;
  updatedBy?: mongoose.Types.ObjectId | string;
  createdAt: Date;
  updatedAt: Date;
}

const wikiLinkSubSchema = new Schema<IKnowledgeWikiLinkSubDoc>(
  {
    title: { type: String, required: true },
    url: { type: String, required: false },
  },
  { _id: false },
);

const knowledgeSchema = new Schema<IKnowledgeDocument>(
  {
    category: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    wikiLinks: {
      type: [wikiLinkSubSchema],
      default: [],
    },
    metadata: {
      hierarchyLevel: { type: String, required: true },
      tags: { type: [String], default: [] },
      createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: false },
      lastVerified: { type: Date, required: false },
      productId: { type: Schema.Types.ObjectId, ref: 'Product', required: false },
    },
    status: {
      type: String,
      enum: ['DRAFT', 'ACTIVE', 'REJECTED'],
      default: 'DRAFT',
      required: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
  },
  { timestamps: true, collection: 'knowledge' },
);

knowledgeSchema.index(
  { title: 'text', content: 'text', 'metadata.tags': 'text' },
  { name: 'knowledge_text_index' },
);
knowledgeSchema.index({ updatedAt: -1 });
knowledgeSchema.index({ category: 1, isActive: 1 });
knowledgeSchema.index({ status: 1, updatedAt: -1 });

export const KnowledgeModel = (mongoose.models.Knowledge as mongoose.Model<IKnowledgeDocument>) ||
  mongoose.model<IKnowledgeDocument>('Knowledge', knowledgeSchema);

export default KnowledgeModel;

const mongoose = require("mongoose");

const modelRegistrySchema = new mongoose.Schema(
  {
    modelName: {
      type: String,
      required: true,
      index: true,
    },
    modelType: {
      type: String,
      enum: ["FORECAST", "ANOMALY_DETECTION", "CATEGORIZATION", "RISK_SCORING"],
      required: true,
      index: true,
    },
    version: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "EXPERIMENTAL", "RETIRED"],
      default: "ACTIVE",
      index: true,
    },
    trainingDate: {
      type: Date,
      default: Date.now,
    },
    datasetSize: {
      type: Number,
      default: 0,
    },
    evaluationMetrics: {
      mae: { type: Number, default: 0 },
      rmse: { type: Number, default: 0 },
      mape: { type: Number, default: 0 },
      precision: { type: Number, default: 0 },
      recall: { type: Number, default: 0 },
      f1Score: { type: Number, default: 0 },
    },
    hyperparameters: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    deployedAt: {
      type: Date,
      default: Date.now,
    },
    retiredAt: {
      type: Date,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ModelRegistry", modelRegistrySchema);

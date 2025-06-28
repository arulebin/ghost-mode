import * as tf from "@tensorflow/tfjs"

export class MLTrainer {
  private model: tf.LayersModel | null = null
  private trainingData: { inputs: number[][]; outputs: number[][] } = {
    inputs: [],
    outputs: [],
  }

  constructor() {
    this.initializeModel()
  }

  private initializeModel() {
    this.model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [10], units: 16, activation: "relu" }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 8, activation: "relu" }),
        tf.layers.dropout({ rate: 0.1 }),
        tf.layers.dense({ units: 4, activation: "sigmoid" }),
      ],
    })

    this.model.compile({
      optimizer: tf.train.adam(0.001),
      loss: "binaryCrossentropy",
      metrics: ["accuracy"],
    })
  }

  public addTrainingExample(features: number[], isTracking: boolean, trackingType: string) {
    this.trainingData.inputs.push(features)

    // One-hot encode the output
    const output = [0, 0, 0, 0] // [canvas, webgl, audio, other]
    if (isTracking) {
      switch (trackingType) {
        case "canvas":
          output[0] = 1
          break
        case "webgl":
          output[1] = 1
          break
        case "audio":
          output[2] = 1
          break
        default:
          output[3] = 1
      }
    }

    this.trainingData.outputs.push(output)
  }

  public async trainModel(): Promise<void> {
    if (!this.model || this.trainingData.inputs.length < 10) {
      throw new Error("Insufficient training data")
    }

    const xs = tf.tensor2d(this.trainingData.inputs)
    const ys = tf.tensor2d(this.trainingData.outputs)

    try {
      await this.model.fit(xs, ys, {
        epochs: 50,
        batchSize: 32,
        validationSplit: 0.2,
        shuffle: true,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            console.log(`Epoch ${epoch}: loss = ${logs?.loss}, accuracy = ${logs?.acc}`)
          },
        },
      })

      console.log("Model training completed")
    } finally {
      xs.dispose()
      ys.dispose()
    }
  }

  public async predict(features: number[]): Promise<number[]> {
    if (!this.model) {
      throw new Error("Model not initialized")
    }

    const prediction = this.model.predict(tf.tensor2d([features])) as tf.Tensor
    const result = await prediction.data()
    prediction.dispose()

    return Array.from(result)
  }

  public async saveModel(): Promise<string> {
    if (!this.model) {
      throw new Error("Model not initialized")
    }

    const modelData = await this.model.save(
      tf.io.withSaveHandler(async (artifacts) => {
        return {
          modelArtifactsInfo: {
            dateSaved: new Date(),
            modelTopologyType: "JSON",
          },
        }
      }),
    )

    return JSON.stringify(modelData)
  }

  public getTrainingStats() {
    return {
      totalSamples: this.trainingData.inputs.length,
      features: this.trainingData.inputs[0]?.length || 0,
      classes: this.trainingData.outputs[0]?.length || 0,
    }
  }

  // Simulate continuous learning
  public async continuousLearning() {
    setInterval(async () => {
      if (this.trainingData.inputs.length > 100) {
        try {
          await this.trainModel()
          console.log("Continuous learning update completed")
        } catch (error) {
          console.error("Continuous learning failed:", error)
        }
      }
    }, 300000) // Every 5 minutes
  }
}

// -----------------------------------------------------------------------------
// Singleton helper
// -----------------------------------------------------------------------------
// If consumers import `mlTrainer` they get a ready-to-use instance and
// no longer need to call the class constructor manually (which caused
// “Class constructor MLTrainer cannot be invoked without 'new'”).

export const mlTrainer = new MLTrainer()

// For backward compatibility you can still do `new MLTrainer()` if you need a
// separate instance, but typical usage should be:
//
//   import { mlTrainer } from "@/utils/ml-trainer"
//   mlTrainer.addTrainingExample(...)
// -----------------------------------------------------------------------------

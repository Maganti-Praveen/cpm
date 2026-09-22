// Service class or helper functions for forecastEngine business logic.
// Contains operations for database queries, transformations, and system actions.

import { SimpleLinearRegression } from "ml-regression";

/**
 * Base Forecast Strategy Interface
 */
export class ForecastStrategy {
  /**
   * Predict future values based on history.
   * @param {Array<{monthIndex: number, revenue: number}>} history - Historical data points.
   * @param {number} stepsAhead - Number of future steps to predict.
   * @returns {{predictions: Array<number>, confidence: number}} Predictions array and confidence percentage.
   */
  predict(history, stepsAhead) {
    throw new Error("Method 'predict()' must be implemented.");
  }
}

/**
 * Simple Linear Regression Strategy
 */
export class LinearRegressionStrategy extends ForecastStrategy {
  predict(history, stepsAhead) {
    if (!history || history.length === 0) {
      return { predictions: Array(stepsAhead).fill(0), confidence: 0 };
    }

    const y = history.map((d) => d.revenue);
    const yMean = y.reduce((sum, val) => sum + val, 0) / y.length;

    // Handle edge case of < 3 data points
    if (history.length < 3) {
      const avgRevenue = Math.round(yMean);
      const confidence = history.length === 1 ? 50 : 60;
      return {
        predictions: Array(stepsAhead).fill(avgRevenue),
        confidence
      };
    }

    const x = history.map((d) => d.monthIndex);
    const xMean = x.reduce((sum, val) => sum + val, 0) / x.length;

    // Check for division by zero risk (variance of x is zero if all x are identical)
    let xVar = 0;
    for (let i = 0; i < x.length; i++) {
      xVar += Math.pow(x[i] - xMean, 2);
    }

    if (xVar === 0) {
      return {
        predictions: Array(stepsAhead).fill(Math.round(yMean)),
        confidence: 0
      };
    }

    let regression;
    try {
      regression = new SimpleLinearRegression(x, y);
    } catch (e) {
      return {
        predictions: Array(stepsAhead).fill(Math.round(yMean)),
        confidence: 0
      };
    }

    const lastX = x[x.length - 1];
    const predictions = [];
    
    for (let i = 1; i <= stepsAhead; i++) {
      const targetX = lastX + i;
      const predictedValue = regression.predict(targetX);
      if (isNaN(predictedValue) || !isFinite(predictedValue)) {
        predictions.push(Math.round(yMean));
      } else {
        predictions.push(Math.max(0, Math.round(predictedValue)));
      }
    }

    // Calculate Coefficient of Determination (R^2)
    let ssRes = 0;
    let ssTot = 0;

    for (let i = 0; i < y.length; i++) {
      const predicted = regression.predict(x[i]);
      if (!isNaN(predicted) && isFinite(predicted)) {
        ssRes += Math.pow(y[i] - predicted, 2);
      } else {
        ssRes += Math.pow(y[i] - yMean, 2);
      }
      ssTot += Math.pow(y[i] - yMean, 2);
    }

    let r2 = 0;
    if (ssTot > 0) {
      r2 = 1 - (ssRes / ssTot);
    }

    const confidence = Math.max(0, Math.min(100, Math.round(r2 * 100)));

    return {
      predictions,
      confidence,
    };
  }
}

/**
 * Context container for executing predictions
 */
export class ForecastEngine {
  constructor(strategy = new LinearRegressionStrategy()) {
    this.strategy = strategy;
  }

  setStrategy(strategy) {
    this.strategy = strategy;
  }

  run(history, stepsAhead) {
    return this.strategy.predict(history, stepsAhead);
  }
}

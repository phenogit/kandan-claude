// src/app/api/workers/price-monitor/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDatabases } from "@/lib/mongodb";
import { fetchStockPrice } from "@/lib/priceService";
import { ObjectId } from "mongodb";

// Verify this is a cron job request (security)
function verifyCronRequest(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return false;
  }
  return true;
}

// Check if current time is within Taiwan market hours
function isMarketHours(): boolean {
  const now = new Date();
  const taiwanTime = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Taipei" })
  );
  const hour = taiwanTime.getHours();
  const day = taiwanTime.getDay();

  // Market hours: Mon-Fri, 9:00 AM - 1:30 PM
  const isWeekday = day >= 1 && day <= 5;
  const isMarketOpen =
    hour === 9 ||
    hour === 10 ||
    hour === 11 ||
    hour === 12 ||
    (hour === 13 && taiwanTime.getMinutes() <= 30);

  return isWeekday && isMarketOpen;
}

// Calculate profit rate based on direction
function calculateProfitRate(
  startPrice: number,
  endPrice: number,
  direction: number,
  confidence: number
): { profitRate: number; profitRateAdjusted: number } {
  let profitRate: number;

  if (direction === 1) {
    // Bull: profit when price goes up
    profitRate = ((endPrice - startPrice) / startPrice) * 100;
  } else {
    // Bear: profit when price goes down
    profitRate = ((startPrice - endPrice) / startPrice) * 100;
  }

  const profitRateAdjusted = profitRate * (confidence / 5);

  return { profitRate, profitRateAdjusted };
}

// Resolve a prediction
async function resolvePrediction(
  newDb: any,
  prediction: any,
  endPrice: number,
  status: "auto-success" | "auto-fail"
) {
  const { profitRate, profitRateAdjusted } = calculateProfitRate(
    prediction.startPrice,
    endPrice,
    prediction.direction,
    prediction.confidence
  );

  // Update prediction
  await newDb.collection("predictions").updateOne(
    { _id: prediction._id },
    {
      $set: {
        status,
        endPrice,
        profitRate,
        profitRateAdjusted,
        resolvedAt: new Date(),
        updatedAt: new Date(),
      },
    }
  );

  console.log(
    `✅ Resolved prediction ${prediction._id}: ${status}, profit: ${profitRate.toFixed(2)}%`
  );

  return { profitRate, profitRateAdjusted };
}

// Resolve all followed predictions (chain resolution)
async function resolveFollowedPredictions(
  newDb: any,
  parentPredictionId: ObjectId,
  parentEndPrice: number,
  parentStatus: string
) {
  // Find all predictions based on this parent that are still pending
  const followedPredictions = await newDb
    .collection("predictions")
    .find({
      basedOnPredictionId: parentPredictionId,
      status: "pending",
    })
    .toArray();

  console.log(
    `Found ${followedPredictions.length} followed predictions to resolve`
  );

  for (const followedPred of followedPredictions) {
    // Resolve with parent's end price
    // Convert manual to auto for followed predictions
    const status = parentStatus.includes("success")
      ? "auto-success"
      : "auto-fail";

    await resolvePrediction(newDb, followedPred, parentEndPrice, status as any);

    // TODO: Create notification for followed prediction owner

    // Recursively resolve any predictions following this one
    await resolveFollowedPredictions(
      newDb,
      followedPred._id,
      parentEndPrice,
      status
    );
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify cron request
    if (!verifyCronRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if market is open (optional - can run anytime for testing)
    const marketOpen = isMarketHours();
    console.log(`🕐 Market hours check: ${marketOpen ? "OPEN" : "CLOSED"}`);

    // Connect to database
    const { newDb } = await connectDatabases();

    // Get all pending predictions
    const pendingPredictions = await newDb
      .collection("predictions")
      .find({ status: "pending" })
      .toArray();

    console.log(`📊 Found ${pendingPredictions.length} pending predictions`);

    if (pendingPredictions.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No pending predictions to process",
        marketOpen,
        duration: Date.now() - startTime,
      });
    }

    // Group predictions by ticker to batch price fetches
    const tickerMap = new Map<string, any[]>();
    for (const pred of pendingPredictions) {
      if (!tickerMap.has(pred.ticker)) {
        tickerMap.set(pred.ticker, []);
      }
      tickerMap.get(pred.ticker)!.push(pred);
    }

    const tickers = Array.from(tickerMap.keys());
    console.log(`📈 Fetching prices for ${tickers.length} unique stocks`);

    let updatedCount = 0;
    let resolvedCount = 0;
    let errorCount = 0;

    // Process each ticker
    for (const ticker of tickers) {
      try {
        // Fetch current price
        const priceData = await fetchStockPrice(ticker);
        const { price: currentPrice, dailyHigh, dailyLow } = priceData;

        console.log(
          `💰 ${ticker}: $${currentPrice} (H: $${dailyHigh}, L: $${dailyLow})`
        );

        const predictions = tickerMap.get(ticker)!;

        for (const pred of predictions) {
          try {
            // Update current price
            await newDb.collection("predictions").updateOne(
              { _id: pred._id },
              {
                $set: {
                  currentPrice,
                  currentPriceUpdatedAt: new Date(),
                  updatedAt: new Date(),
                },
              }
            );
            updatedCount++;

            // Check for resolution
            let shouldResolve = false;
            let status: "auto-success" | "auto-fail" | null = null;
            let endPrice: number | null = null;

            // Check if ceiling hit
            if (dailyHigh >= pred.ceiling || currentPrice >= pred.ceiling) {
              shouldResolve = true;
              endPrice = pred.ceiling;
              // Bull: success when hits ceiling, Bear: fail when hits ceiling
              status = pred.direction === 1 ? "auto-success" : "auto-fail";
            }
            // Check if floor hit
            else if (dailyLow <= pred.floor || currentPrice <= pred.floor) {
              shouldResolve = true;
              endPrice = pred.floor;
              // Bull: fail when hits floor, Bear: success when hits floor
              status = pred.direction === 1 ? "auto-fail" : "auto-success";
            }

            if (shouldResolve && status && endPrice) {
              console.log(`🎯 Resolving ${ticker} prediction: ${status}`);

              // Resolve the prediction
              await resolvePrediction(newDb, pred, endPrice, status);
              resolvedCount++;

              // Resolve all followed predictions (chain resolution)
              await resolveFollowedPredictions(
                newDb,
                pred._id,
                endPrice,
                status
              );

              // TODO: Update user statistics
              // TODO: Create notification for user
            }
          } catch (predError) {
            console.error(
              `Error processing prediction ${pred._id}:`,
              predError
            );
            errorCount++;
          }
        }
      } catch (priceError) {
        console.error(`Error fetching price for ${ticker}:`, priceError);
        errorCount++;
      }
    }

    const duration = Date.now() - startTime;
    const summary = {
      success: true,
      marketOpen,
      totalPending: pendingPredictions.length,
      uniqueTickers: tickers.length,
      pricesUpdated: updatedCount,
      predictionsResolved: resolvedCount,
      errors: errorCount,
      duration: `${duration}ms`,
    };

    console.log("📋 Worker Summary:", summary);

    return NextResponse.json(summary);
  } catch (error) {
    console.error("❌ Worker error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        duration: `${Date.now() - startTime}ms`,
      },
      { status: 500 }
    );
  }
}

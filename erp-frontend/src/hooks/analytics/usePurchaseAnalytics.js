import { useMemo } from "react";

export default function usePurchaseAnalytics({
  purchaseKpis = {},
  selectedItemCode = "",
}) {
  const batches = useMemo(
    () =>
      Array.isArray(purchaseKpis?.batches)
        ? purchaseKpis.batches
        : [],
    [purchaseKpis]
  );

  // ------------------------------------------------------------
  // Purchased item codes returned directly by backend
  // ------------------------------------------------------------

  const purchaseItemCodes = useMemo(() => {
    return [
        ...new Set(
        batches
            .map((batch) => batch?.item_code)
            .filter(Boolean)
        ),
    ].sort((a, b) => a.localeCompare(b));
    }, [batches]);

  // ------------------------------------------------------------
  // Filter batches by selected purchased item
  // ------------------------------------------------------------

  const filteredBatches = useMemo(() => {
    if (!selectedItemCode) {
      return batches;
    }

    return batches.filter(
      (batch) =>
        batch?.item_code === selectedItemCode
    );
  }, [batches, selectedItemCode]);

  // ------------------------------------------------------------
  // KPIs
  // ------------------------------------------------------------

  const summary = useMemo(() => {
    const rows = filteredBatches;

    const rates = rows
      .map((x) => Number(x?.rate || 0))
      .filter((x) => Number.isFinite(x));

    const totalPurchaseValue = rows.reduce(
      (sum, x) =>
        sum + Number(x?.amount || 0),
      0
    );

    const totalQuantity = rows.reduce(
      (sum, x) =>
        sum + Number(x?.quantity || 0),
      0
    );

    const weightedRate =
      totalQuantity > 0
        ? rows.reduce(
            (sum, x) =>
              sum +
              Number(x?.rate || 0) *
                Number(x?.quantity || 0),
            0
          ) / totalQuantity
        : 0;

    return {
      totalPurchaseValue,
      totalQuantity,
      batchCount: rows.length,

      supplierCount: new Set(
        rows
          .map((x) => x?.supplier)
          .filter(Boolean)
      ).size,

      itemCount: selectedItemCode
        ? 1
        : new Set(
            rows
              .map((x) => x?.item_code)
              .filter(Boolean)
          ).size,

      averageBatchRate:
        rates.length > 0
          ? rates.reduce((a, b) => a + b, 0) /
            rates.length
          : 0,

      weightedAverageRate: weightedRate,

      minimumBatchRate:
        rates.length > 0
          ? Math.min(...rates)
          : 0,

      maximumBatchRate:
        rates.length > 0
          ? Math.max(...rates)
          : 0,
    };
  }, [filteredBatches, selectedItemCode]);

  // ------------------------------------------------------------
  // Filter-dependent analytics
  // ------------------------------------------------------------

  const supplierAnalysis = useMemo(() => {
    const rows = filteredBatches;

    const map = new Map();

    for (const batch of rows) {
      const supplier =
        batch?.supplier || "Unknown";

      if (!map.has(supplier)) {
        map.set(supplier, {
          supplier,
          batch_count: 0,
          quantity: 0,
          total_spend: 0,
          rates: [],
        });
      }

      const data = map.get(supplier);

      data.batch_count += 1;
      data.quantity += Number(
        batch?.quantity || 0
      );
      data.total_spend += Number(
        batch?.amount || 0
      );
      data.rates.push(
        Number(batch?.rate || 0)
      );
    }

    return [...map.values()]
      .map((data) => ({
        supplier: data.supplier,
        batch_count: data.batch_count,
        quantity: data.quantity,
        total_spend: data.total_spend,

        average_rate:
          data.rates.length
            ? data.rates.reduce(
                (a, b) => a + b,
                0
              ) / data.rates.length
            : 0,

        minimum_rate:
          data.rates.length
            ? Math.min(...data.rates)
            : 0,

        maximum_rate:
          data.rates.length
            ? Math.max(...data.rates)
            : 0,
      }))
      .sort(
        (a, b) =>
          b.total_spend - a.total_spend
      );
  }, [filteredBatches]);

  // ------------------------------------------------------------
  // Rate distribution
  // ------------------------------------------------------------

  const rateDistribution = useMemo(
    () =>
      filteredBatches
        .map((batch) =>
          Number(batch?.rate || 0)
        )
        .filter((rate) =>
          Number.isFinite(rate)
        )
        .sort((a, b) => a - b),
    [filteredBatches]
  );

  // ------------------------------------------------------------
  // Rate trend
  // ------------------------------------------------------------

  const rateTrend = useMemo(() => {
    const dailyRates = new Map();

    for (const batch of filteredBatches) {
      const date = batch?.purchase_date;

      if (!date) continue;

      if (!dailyRates.has(date)) {
        dailyRates.set(date, []);
      }

      dailyRates
        .get(date)
        .push(Number(batch?.rate || 0));
    }

    return [...dailyRates.entries()]
      .sort(([a], [b]) =>
        a.localeCompare(b)
      )
      .map(([date, rates]) => ({
        date,

        average_rate:
          rates.reduce(
            (a, b) => a + b,
            0
          ) / rates.length,

        minimum_rate: Math.min(...rates),
        maximum_rate: Math.max(...rates),

        batch_count: rates.length,
      }));
  }, [filteredBatches]);

  // ------------------------------------------------------------
  // Box plot
  // ------------------------------------------------------------

  function percentile(values, p) {
    if (!values.length) return 0;

    const sorted = [...values].sort(
      (a, b) => a - b
    );

    const index =
      (sorted.length - 1) * p;

    const lower = Math.floor(index);
    const upper = Math.ceil(index);

    if (lower === upper) {
      return sorted[lower];
    }

    return (
      sorted[lower] +
      (sorted[upper] - sorted[lower]) *
        (index - lower)
    );
  }

  function getBoxStats(values) {
    const sorted = [...values].sort(
      (a, b) => a - b
    );

    if (!sorted.length) {
      return {
        min: 0,
        q1: 0,
        median: 0,
        q3: 0,
        max: 0,
        outliers: [],
      };
    }

    const q1 = percentile(sorted, 0.25);
    const median = percentile(sorted, 0.5);
    const q3 = percentile(sorted, 0.75);

    const iqr = q3 - q1;

    const lowerFence =
      q1 - 1.5 * iqr;

    const upperFence =
      q3 + 1.5 * iqr;

    const nonOutliers =
      sorted.filter(
        (x) =>
          x >= lowerFence &&
          x <= upperFence
      );

    const outliers =
      sorted.filter(
        (x) =>
          x < lowerFence ||
          x > upperFence
      );

    return {
      min:
        nonOutliers[0] ??
        sorted[0],

      q1,
      median,
      q3,

      max:
        nonOutliers[
          nonOutliers.length - 1
        ] ??
        sorted[
          sorted.length - 1
        ],

      outliers,
    };
  }

  return {
    summary,

    batches: filteredBatches,

    supplierAnalysis,

    itemAnalysis:
      purchaseKpis?.item_analysis ?? [],

    rateTrend,

    rateDistribution,

    mostExpensiveBatch:
      filteredBatches.length
        ? filteredBatches.reduce(
            (max, batch) =>
              Number(batch.rate || 0) >
              Number(max.rate || 0)
                ? batch
                : max
          )
        : null,

    cheapestBatch:
      filteredBatches.length
        ? filteredBatches.reduce(
            (min, batch) =>
              Number(batch.rate || 0) <
              Number(min.rate || 0)
                ? batch
                : min
          )
        : null,

    largestBatches:
      [...filteredBatches]
        .sort(
          (a, b) =>
            Number(b.amount || 0) -
            Number(a.amount || 0)
        )
        .slice(0, 10),

    getBoxStats,

    purchaseItemCodes,
  };
}
import { regionData } from "./data.js";

let colorsData = {
    "Low income": "#ffb4a2",
    "Lower middle income": "#e5989b",
    "Upper middle income": "#b5838d",
    "High income": "#6d6875",
};

//---
const y = 300;
const baseArea = 280;
let calcRadius = (average) => (Math.sqrt((baseArea * average) / Math.PI));
let incomeRadius = 120;

// --
let currentBubbleContext = {
    node: undefined,
    text1: undefined,
    text2: undefined,
};

function showInfoBubble(e, v, i, incomeNames, fertilityRatesData) {
    gtap.$stopMouseDefaults(e);

    console.log("incomeNames:", incomeNames[i], fertilityRatesData.rawItemAtIndex(i))
    const nodeSize = 50;

    if (currentBubbleContext.node != undefined) {
        currentBubbleContext.node.remove();
        currentBubbleContext.text1.remove();
        currentBubbleContext.text2.remove();
    }

    const point = v.__arcEnd()
    const x = point.x + 10;
    const y = point.y + 10;
    const xOffset = x + 5;
    const yOffset = y + 13;
    const yTextOffset = 8;

    const node = gtap.rect(v.$parentElm);
    node.$xy(x, y);
    node.$size(150, 40);
    const style = `fill:#fff; stroke:#222; opacity:0.5`;
    node.$style(style);

    const text1 = gtap.text(v.$parentElm)
    text1.$style(`fill: #1d3557; font-size: 12px; font-weight:600`);
    text1.$xy(xOffset, yOffset);
    text1.$text(`${incomeNames[i]}`)

    const text2 = gtap.text(v.$parentElm)
    text2.$style(`fill: #1d3557; font-size: 12px`);
    text2.$xy(xOffset, yOffset + 2 * yTextOffset);
    text2.$text(`fertility rate: ${fertilityRatesData.rawItemAtIndex(i).toFixed(2)}`)

    currentBubbleContext.node = node;
    currentBubbleContext.text1 = text1
    currentBubbleContext.text2 = text2
}

function hideInfoBubble(e) {
    gtap.$stopMouseDefaults(e);
    currentBubbleContext.node.remove();
    currentBubbleContext.text1.remove();
    currentBubbleContext.text2.remove();

    currentBubbleContext.node = undefined
    currentBubbleContext.text1 = undefined
    currentBubbleContext.text1 = undefined
}

function drawVisual(ctx, maxPeriodAverage, period, x, y, rotateOffest, bodyFill) {
    let radius = calcRadius(period.average);
    const fertilityRates = [];

    const incomeNames = []
    for (const incomeKey in period.incomes) {
        fertilityRates.push(period.incomes[incomeKey].average)
        incomeNames.push(incomeKey)
    }

    const fertilityRatesData = gtap.$data(fertilityRates);
    fertilityRatesData.forcedMax(maxPeriodAverage);

    gtap.renderVisuals(ctx, [
        gtap.$arcs(gtap.$data([period.average]), [
            gtap.$xy([x, y]),
            gtap.$arcRadius(radius),
            gtap.$arcRotateBy(rotateOffest),
            gtap.$arcSpanUnit(180),
            gtap.$arcSpanOffset(0),
            gtap.$arcRadiusOffset(5),
            gtap.$style(bodyFill),
        ]),

        gtap.$radialLines(fertilityRatesData, [
            gtap.$xy([x, y]),
            gtap.$arcMaxRadius(incomeRadius),
            gtap.$arcRotateBy(rotateOffest + 45),
            gtap.$arcSpanOffset(30),
            gtap.$radialOffset(radius + 1),
            gtap.$appendCSS("radial-line-dark"),
            gtap.$lambda((v, i) => {
                const point = v.__arcEnd()
                const node = gtap.ellipse(v.$parentElm);
                node.$x(point.x)
                node.$y(point.y)
                node.$size(3, 3)
                node.$style(`fill: ${colorsData[incomeNames[i]]}`)

                node.onmouseover = (e) => showInfoBubble(e, v, i, incomeNames, fertilityRatesData);
                node.onmouseleave = (e) => hideInfoBubble(e);
            }),
        ]),
    ]);
}

function drawRegion(ctx, periodAverages1, periodAverages2, regionName, region, x, y) {
    const period1 = region.years[1960]
    const period2 = region.years[2019]

    const period1AveragesData = gtap.$data(periodAverages1)
    const period2AveragesData = gtap.$data(periodAverages2)

    const maxPeriod1Average = period1AveragesData.max()
    const maxPeriod2Average = period2AveragesData.max()

    drawVisual(ctx, maxPeriod1Average, period1, x, y, -90, "fill: #6c757d; stroke:none;")
    drawVisual(ctx, maxPeriod2Average, period2, x, y + 1, 90, "fill: #ced4da")

    // Region Name
    gtap.renderVisuals(ctx, [
        gtap.$label(regionName, [
            gtap.$xy([x, y + 180]),
            gtap.$textAnchor("middle"),
            gtap.$style("font-size:12px; fill:#1d3557"),
        ]),
    ]);
}

function getAllPeriodAverages(regionData, peridYear) {
    const periodAverages = []
    for (const regionName in regionData) {
        const region = regionData[regionName]
        const period = region.years[peridYear]
        for (const incomeKey in period.incomes) {
            periodAverages.push(period.incomes[incomeKey].average)
        }
    }
    return periodAverages
}

function drawChartKey(ctx) {
    let xOffset = 450;
    const incomeNames = [];

    for (const incomeName in colorsData) {
        incomeNames.push(incomeName)
    }
    gtap.renderVisuals(ctx, [
        gtap.$hLine([
            gtap.$xy([xOffset + 5, y + 210]),
            gtap.$width(480),
            gtap.$style(`stroke: #1d3557; stroke-width:1px`),
        ]),

        gtap.$labels(gtap.$data(incomeNames), [
            gtap.$xy([xOffset, y + 250]),
            gtap.$lambda((v, i) => {
                v.$style(`fill: #1d3557; font-size: 12px`);
                v.$fontSize(12);
                v.$text(incomeNames[i]);

                const box = v.$textBoxSize();
                v.$x(xOffset)
                xOffset += box.width + 40

                const e = gtap.ellipse(v.$parentElm);
                e.$x(v.$x() - 8)
                e.$y(v.$y() - 4.5)
                e.$size(3, 3)
                e.$style(`fill: ${colorsData[incomeNames[i]]}`)
            }),
        ]),
    ]);
}
// --

let ctx = gtap.container("vis", gtap.$id("vis-1"));

function drawRegions(ctx, regionData, y) {
    let xOffset = 100;
    let indexOffset = 0;
    const rSpacing = 170;

    const periodAverages1 = getAllPeriodAverages(regionData, 1960);
    const periodAverages2 = getAllPeriodAverages(regionData, 2019);

    for (const regionName in regionData) {
        const region = regionData[regionName]
        const x = 150 + indexOffset * rSpacing
        drawRegion(ctx, periodAverages1, periodAverages2, regionName, region, x, y)
        indexOffset++
    }

    // Chart Key
    drawChartKey(ctx)

    // Chart Title
    gtap.renderVisuals(ctx, [
        gtap.$hLine([
            gtap.$xy([xOffset, y]),
            gtap.$width(1130),
            gtap.$style(`stroke: #1d3557; stroke-width:1px`),
        ]),

        gtap.$labels(gtap.$data([1960, 2019]), [
            gtap.$xy([xOffset + 1200, y - 80]),
            gtap.$style(`fill: #ced4da; font-size: 25px; font-weight:200`),
            gtap.$rawDataValue(),
            gtap.$yOffset(200),
        ]),

        gtap.$labels(gtap.$data(["A Comparison of Fertility Rates", "Between 1960 and 2019"]), [
            gtap.$xy([xOffset + 600, 80]),
            gtap.$rawDataValue(),
            gtap.$yOffset(35),
            gtap.$lambda((v, i) => {
                if (i == 0) {
                    v.$style(`fill: #1A1A1A; font-size: 30px; font-weight:600`);
                } else {
                    v.$style(`fill: #ced4da; font-size: 25px; font-weight:100`);
                }
                v.$textAnchor("middle");
            })
        ])
    ])
}

// --
drawRegions(ctx, regionData, y)


/* eslint-disable */
"use client";
import { useRef, useEffect, useState } from "react";
import { select } from "d3-selection";
import { scaleBand, scaleLinear, scaleOrdinal } from "d3-scale";
import { max } from "d3-array";
import { axisBottom, axisLeft } from "d3-axis";
import { csv } from "d3-fetch";

interface AnimalDatum {
  name: string;
  speed: number;
  diet: "carnivore" | "herbivore" | "omnivore";
}

const DIET_COLORS: Record<string, string> = {
  carnivore: "#ef4444",
  herbivore: "#22c55e",
  omnivore: "#3b82f6",
};

export default function AnimalSpeedGraph() {
  const graphRef = useRef<HTMLDivElement>(null);
  const [animalData, setAnimalData] = useState<AnimalDatum[]>([]);

  // Load CSV data
  useEffect(() => {
    csv("/sample_animals.csv").then((rawData) => {
      const validDiets = new Set(["carnivore", "herbivore", "omnivore"]);
      const parsed: AnimalDatum[] = rawData
        .map((d) => ({
          name: (d.name ?? "").trim(),
          speed: Number(d.speed),
          diet: (d.diet ?? "").trim().toLowerCase(),
        }))
        .filter(
          (d): d is AnimalDatum =>
            d.name !== "" && !isNaN(d.speed) && d.speed > 0 && validDiets.has(d.diet)
        );

      // Sort by speed descending for a cleaner chart
      parsed.sort((a, b) => b.speed - a.speed);

      // Take top 20 to keep the chart readable
      setAnimalData(parsed.slice(0, 20));
    }).catch((err) => {
      console.error("Error loading CSV:", err);
    });
  }, []);

  // Render chart
  useEffect(() => {
    if (graphRef.current) {
      graphRef.current.innerHTML = "";
    }

    if (animalData.length === 0) return;

    const margin = { top: 40, right: 150, bottom: 100, left: 70 };
    const width = Math.max(graphRef.current?.clientWidth ?? 800, 700);
    const height = 500;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = select(graphRef.current!)
      .append<SVGSVGElement>("svg")
      .attr("width", width)
      .attr("height", height);

    const chart = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // X scale — animal names
    const xScale = scaleBand()
      .domain(animalData.map((d) => d.name))
      .range([0, innerWidth])
      .padding(0.2);

    // Y scale — speed
    const yScale = scaleLinear()
      .domain([0, max(animalData, (d) => d.speed) ?? 120])
      .nice()
      .range([innerHeight, 0]);

    // Color scale — diet
    const colorScale = scaleOrdinal<string>()
      .domain(["carnivore", "herbivore", "omnivore"])
      .range(["#ef4444", "#22c55e", "#3b82f6"]);

    // Draw bars
    chart
      .selectAll("rect")
      .data(animalData)
      .enter()
      .append("rect")
      .attr("x", (d) => xScale(d.name) ?? 0)
      .attr("y", (d) => yScale(d.speed))
      .attr("width", xScale.bandwidth())
      .attr("height", (d) => innerHeight - yScale(d.speed))
      .attr("fill", (d) => colorScale(d.diet))
      .attr("rx", 3)
      .attr("opacity", 0.85);

    // X axis
    chart
      .append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(axisBottom(xScale))
      .selectAll("text")
      .attr("transform", "rotate(-40)")
      .style("text-anchor", "end")
      .style("font-size", "11px");

    // Y axis
    chart.append("g").call(axisLeft(yScale));

    // Y axis label
    chart
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -55)
      .attr("x", -innerHeight / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "13px")
      .style("fill", "currentColor")
      .text("Speed (km/h)");

    // X axis label
    chart
      .append("text")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + 85)
      .attr("text-anchor", "middle")
      .style("font-size", "13px")
      .style("fill", "currentColor")
      .text("Animal");

    // Title
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", 25)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .style("fill", "currentColor")
      .text("Animal Speed by Diet");

    // Legend
    const legendData = ["carnivore", "herbivore", "omnivore"];
    const legend = svg
      .append("g")
      .attr("transform", `translate(${width - margin.right + 15}, ${margin.top})`);

    legendData.forEach((diet, i) => {
      const row = legend.append("g").attr("transform", `translate(0, ${i * 25})`);
      const fillColor: string = DIET_COLORS[diet] ?? "#888888";
      row
        .append("rect")
        .attr("width", 14)
        .attr("height", 14)
        .attr("rx", 2)
        .attr("fill", fillColor);
      row
        .append("text")
        .attr("x", 20)
        .attr("y", 12)
        .style("font-size", "12px")
        .style("fill", "currentColor")
        .text(diet.charAt(0).toUpperCase() + diet.slice(1));
    });
  }, [animalData]);

  return (
    <div
      ref={graphRef}
      className="w-full overflow-x-auto rounded-lg border border-border bg-background p-4"
      style={{ minHeight: "520px" }}
    />
  );
}

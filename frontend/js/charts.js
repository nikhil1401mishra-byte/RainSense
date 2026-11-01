/* ============================================
   RainSense — Charts Module
   Canvas-based rain probability & precip chart
   ============================================ */

const Charts = (() => {
  let chartCanvas = null;
  let chartCtx = null;
  let tooltipEl = null;
  let chartData = null;
  let animationFrame = null;
  let resizeObserver = null;

  function init() {
    chartCanvas = document.getElementById('rain-chart');
    tooltipEl = document.getElementById('chart-tooltip');

    if (!chartCanvas) return;
    chartCtx = chartCanvas.getContext('2d');

    // Mouse events for tooltip
    chartCanvas.addEventListener('mousemove', handleMouseMove);
    chartCanvas.addEventListener('mouseleave', hideTooltip);

    // Resize observer
    resizeObserver = new ResizeObserver(() => {
      if (chartData) renderChart(chartData);
    });
    const wrapper = chartCanvas.parentElement;
    if (wrapper) resizeObserver.observe(wrapper);
  }

  /**
   * Render rain probability chart
   */
  function renderChart(data) {
    if (!chartCtx || !data) return;
    chartData = data;

    const wrapper = chartCanvas.parentElement;
    const rect = wrapper.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    chartCanvas.width = rect.width * dpr;
    chartCanvas.height = rect.height * dpr;
    chartCtx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const padding = { top: 30, right: 20, bottom: 50, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Clear
    chartCtx.clearRect(0, 0, width, height);

    const days = data.daily;
    if (!days || days.length === 0) return;

    const barCount = days.length;
    const barGap = Math.max(8, chartWidth * 0.04);
    const barWidth = Math.max(20, (chartWidth - (barCount - 1) * barGap) / barCount);

    // Get computed styles
    const style = getComputedStyle(document.documentElement);
    const textColor = style.getPropertyValue('--text-muted').trim() || '#64748b';
    const borderColor = style.getPropertyValue('--border-color').trim() || 'rgba(56, 189, 248, 0.12)';
    const accentPrimary = style.getPropertyValue('--accent-primary').trim() || '#00e6d2';
    const accentRain = '#60a5fa';

    // Draw Y-axis grid lines
    chartCtx.strokeStyle = borderColor;
    chartCtx.lineWidth = 0.5;
    chartCtx.font = `11px Inter, sans-serif`;
    chartCtx.fillStyle = textColor;
    chartCtx.textAlign = 'right';

    const ySteps = [0, 25, 50, 75, 100];
    ySteps.forEach(val => {
      const y = padding.top + chartHeight - (val / 100) * chartHeight;
      chartCtx.beginPath();
      chartCtx.moveTo(padding.left, y);
      chartCtx.lineTo(width - padding.right, y);
      chartCtx.stroke();
      chartCtx.fillText(`${val}%`, padding.left - 8, y + 4);
    });

    // Animate bars
    const animationDuration = 600;
    const startTime = performance.now();

    function drawFrame(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic

      chartCtx.clearRect(padding.left, padding.top - 5, chartWidth + padding.right, chartHeight + padding.bottom + 5);

      // Redraw grid
      chartCtx.strokeStyle = borderColor;
      chartCtx.lineWidth = 0.5;
      ySteps.forEach(val => {
        const y = padding.top + chartHeight - (val / 100) * chartHeight;
        chartCtx.beginPath();
        chartCtx.moveTo(padding.left, y);
        chartCtx.lineTo(width - padding.right, y);
        chartCtx.stroke();
      });

      // Draw bars
      days.forEach((day, i) => {
        const x = padding.left + i * (barWidth + barGap) + (chartWidth - barCount * (barWidth + barGap) + barGap) / 2;
        const probability = day.rainProbability || 0;
        const barHeight = (probability / 100) * chartHeight * eased;
        const y = padding.top + chartHeight - barHeight;

        // Bar gradient
        const gradient = chartCtx.createLinearGradient(x, y, x, padding.top + chartHeight);
        gradient.addColorStop(0, accentRain);
        gradient.addColorStop(1, `${accentPrimary}44`);

        // Bar shadow
        chartCtx.shadowColor = `${accentRain}33`;
        chartCtx.shadowBlur = 8;
        chartCtx.shadowOffsetY = 4;

        // Draw bar with rounded top
        const radius = Math.min(6, barWidth / 3);
        chartCtx.beginPath();
        chartCtx.moveTo(x, padding.top + chartHeight);
        chartCtx.lineTo(x, y + radius);
        chartCtx.quadraticCurveTo(x, y, x + radius, y);
        chartCtx.lineTo(x + barWidth - radius, y);
        chartCtx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
        chartCtx.lineTo(x + barWidth, padding.top + chartHeight);
        chartCtx.closePath();
        chartCtx.fillStyle = gradient;
        chartCtx.fill();

        chartCtx.shadowColor = 'transparent';
        chartCtx.shadowBlur = 0;
        chartCtx.shadowOffsetY = 0;

        // Precip amount text on top of bar
        if (progress >= 0.8 && day.precipSum > 0) {
          chartCtx.fillStyle = accentRain;
          chartCtx.font = '10px Inter, sans-serif';
          chartCtx.textAlign = 'center';
          chartCtx.fillText(`${day.precipSum.toFixed(1)}mm`, x + barWidth / 2, y - 8);
        }

        // Day label
        chartCtx.fillStyle = textColor;
        chartCtx.font = '11px Inter, sans-serif';
        chartCtx.textAlign = 'center';
        chartCtx.fillText(day.dayName, x + barWidth / 2, padding.top + chartHeight + 18);

        // Probability label under day
        if (progress >= 0.5) {
          chartCtx.fillStyle = accentRain;
          chartCtx.font = '10px Inter, sans-serif';
          chartCtx.fillText(`${probability}%`, x + barWidth / 2, padding.top + chartHeight + 34);
        }
      });

      if (progress < 1) {
        animationFrame = requestAnimationFrame(drawFrame);
      }
    }

    cancelAnimationFrame(animationFrame);
    animationFrame = requestAnimationFrame(drawFrame);

    // Store bar positions for tooltip
    chartData._bars = days.map((day, i) => {
      const x = padding.left + i * (barWidth + barGap) + (chartWidth - barCount * (barWidth + barGap) + barGap) / 2;
      return { x, width: barWidth, day };
    });
    chartData._chartArea = { top: padding.top, height: chartHeight };
  }

  function handleMouseMove(e) {
    if (!chartData || !chartData._bars) return;

    const rect = chartCanvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const bar = chartData._bars.find(b =>
      mouseX >= b.x && mouseX <= b.x + b.width
    );

    if (bar) {
      const day = bar.day;
      tooltipEl.innerHTML = `
        <strong>${day.dayName} ${day.dateFormatted}</strong><br/>
        Rain: ${day.rainProbability}%<br/>
        Precip: ${day.precipSum.toFixed(1)} mm
      `;
      tooltipEl.style.left = `${e.clientX - chartCanvas.parentElement.getBoundingClientRect().left + 12}px`;
      tooltipEl.style.top = `${e.clientY - chartCanvas.parentElement.getBoundingClientRect().top - 40}px`;
      tooltipEl.classList.add('visible');
    } else {
      hideTooltip();
    }
  }

  function hideTooltip() {
    if (tooltipEl) tooltipEl.classList.remove('visible');
  }

  function destroy() {
    if (resizeObserver) resizeObserver.disconnect();
    cancelAnimationFrame(animationFrame);
  }

  return { init, renderChart, destroy };
})();

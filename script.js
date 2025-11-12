document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gradient-canvas');
    const ctx = canvas.getContext('2d');

    let colorPoints = [];
    let draggingPoint = null;
    let hoveredPoint = null;
    let resizingPoint = null;

    // --- Config ---
    const LOW_RES_SCALE = 0.3; // Render on a smaller canvas for performance

    // --- UI Elements ---
    const randomizeColorsBtn = document.getElementById('randomize-colors-btn');
    const customSelect = document.querySelector('.custom-select');
    const selectTrigger = customSelect.querySelector('.custom-select-trigger');
    const customOptions = customSelect.querySelector('.custom-options');
    const colorPointsContainer = document.getElementById('color-points');
    const addColorPointBtn = document.getElementById('add-color-point-btn');
    const refreshShapeBtn = document.getElementById('refresh-shape-btn');
    const adjustPositionToggle = document.getElementById('adjust-position-toggle');
    const resWidthInput = document.getElementById('res-width');
    const resHeightInput = document.getElementById('res-height');
    const downloadJpgBtn = document.getElementById('download-jpg-btn');

    let isDraggingEnabled = true;

    // --- Color Palettes ---
    const COLOR_PALETTES = {
        "Crimson Sunset": ['#FFE6D4', '#FFC69D', '#E06B80', '#CD2C58'],
        "Emerald Sea": ['#E5E9C5', '#9ECFD4', '#70B2B2', '#016B61'],
        "Earthy Tones": ['#EEEEEE', '#CBCBCB', '#B7B89F', '#777C6D'],
        "Sandy Beach": ['#FBF3D1', '#DEDED1', '#C5C7BC', '#B6AE9F'],
        "Cosmic Fusion": ['#FDCFFA', '#D78FEE', '#9B5DE0', '#4E56C0'],
        "Pastel Dream": ['#FFF7DD', '#B4DEBD', '#91C4C3', '#80A1BA'],
        "Deep Forest": ['#E0D9D9', '#5A9690', '#2F5755', '#432323'],
        "Blue Hour": ['#6E8CFB', '#636CCB', '#50589C', '#3C467B'],
        "Fiery Sky": ['#DD0303', '#FA812F', '#FAB12F', '#FEF3E2'],
        "Vintage Rose": ['#DDC3C3', '#A376A2', '#8D5F8C', '#6B3F69'],
        "Sweet Peach": ['#B95E82', '#F39F9F', '#FFC29B', '#FFECC0'],
        "Purple Haze": ['#FFF1F1', '#E9B3FB', '#6F00FF', '#3B0270'],
        "Misty Meadow": ['#F0F0F0', '#D9E9CF', '#B6CEB4', '#96A78D'],
        "Love Letter": ['#FFACAC', '#E45A92', '#5D2F77', '#3E1E68'],
        "Nightfall": ['#E7F2EF', '#A1C2BD', '#708993', '#19183B'],
        "Spring Fields": ['#F6FF99', '#A7E399', '#48B3AF', '#476EAE'],
        "Cherry Blossom": ['#FDEBD0', '#F7CAC9', '#F75270', '#DC143C'],
        "Summer Sky": ['#FAFDD6', '#AED6CF', '#91ADC8', '#647FBC'],
        "Olive Grove": ['#EFF5D2', '#C6D870', '#8FA31E', '#556B2F'],
        "Coral Reef": ['#FFF2EF', '#FFDBB6', '#F7A5A5', '#5D688A'],
        "Ocean Deep": ['#124170', '#26667F', '#67C090', '#DDF4E7'],
        "Neon Sunset": ['#F78D60', '#EA2264', '#640D5F', '#0D1164'],
        "Desert Night": ['#280A3E', '#689B8A', '#F9CB99', '#F2EDD1'],
        "Royal Blue": ['#B2B0E8', '#7A85C1', '#3B38A0', '#1A2A80'],
        "Winter Morning": ['#17313E', '#415E72', '#C5B0CD', '#F3E2D4'],
        "Retro Red": ['#EEEEEE', '#E7D3D3', '#D25D5D', '#B9375D'],
        "Muted Tones": ['#F8F3CE', '#DDDAD0', '#7A7A73', '#57564F'],
        "Volcanic Ash": ['#FFCC00', '#EB5B00', '#B12C00', '#640D5F'],
        "Lush Green": ['#E8FFD7', '#93DA97', '#5E936C', '#3E5F44'],
        "Soft Neutrals": ['#D9A299', '#DCC5B2', '#F0E4D3', '#FAF7F3'],
        "Forest Floor": ['#FEFAE0', '#B1AB86', '#819067', '#0A400C'],
        "Earthy Greens": ['#E3DE61', '#97B067', '#437057', '#2F5249'],
        "Autumn Sunset": ['#FFECCC', '#FF9587', '#BA487F', '#722323'],
        "Twilight": ['#2A1458', '#9B177E', '#E8988A', '#FFEAD8'],
        "Inferno": ['#FFF287', '#C83F12', '#8A0000', '#3B060A'],
        "Golden Hour": ['#FFEEA9', '#FFBF78', '#FF7D29', '#7B4019'],
        "Aqua Marine": ['#FFEDF3', '#ADEED9', '#56DFCF', '#0ABAB5'],
        "Sage Green": ['#EEEFE0', '#D1D8BE', '#A7C1A8', '#819A91'],
        "Orchid": ['#FEC5F6', '#DB8DD0', '#C562AF', '#B33791'],
        "Sunrise": ['#EA2F14', '#E6521F', '#FB9E3A', '#FCEF91'],
        "Custom": []
    };

    // --- New Fluid Rendering Engine ---
    function renderGradientToCanvas(targetCanvas, points, quality = 'low') {
        const targetCtx = targetCanvas.getContext('2d');
        const width = targetCanvas.width;
        const height = targetCanvas.height;

        const isLowQuality = quality === 'low';
        const scale = isLowQuality ? LOW_RES_SCALE : 1;

        const renderCanvas = isLowQuality ? document.createElement('canvas') : targetCanvas;
        const renderCtx = isLowQuality ? renderCanvas.getContext('2d') : targetCtx;
        const renderWidth = width * scale;
        const renderHeight = height * scale;

        if (isLowQuality) {
            renderCanvas.width = renderWidth;
            renderCanvas.height = renderHeight;
        }

        const imageData = renderCtx.getImageData(0, 0, renderWidth, renderHeight);
        const pixels = imageData.data;

        const scaledPoints = points.map(p => ({
            x: p.x * scale,
            y: p.y * scale,
            radius: p.radius * scale,
            color: {
                r: parseInt(p.color.slice(1, 3), 16),
                g: parseInt(p.color.slice(3, 5), 16),
                b: parseInt(p.color.slice(5, 7), 16),
            }
        }));

        for (let y = 0; y < renderHeight; y++) {
            for (let x = 0; x < renderWidth; x++) {
                let r = 0, g = 0, b = 0, totalWeight = 0;
                for (const point of scaledPoints) {
                    const dx = x - point.x;
                    const dy = y - point.y;
                    const distSq = dx * dx + dy * dy;
                    // Adjust the denominator to control sharpness. A smaller value makes the falloff sharper.
                    const sharpness = 0.5; // Lower value = sharper colors
                    const weight = Math.exp(-distSq / (sharpness * point.radius * point.radius));

                    r += point.color.r * weight;
                    g += point.color.g * weight;
                    b += point.color.b * weight;
                    totalWeight += weight;
                }
                const base = (y * renderWidth + x) * 4;
                // Normalize the colors by the total weight
                pixels[base] = r / totalWeight;
                pixels[base + 1] = g / totalWeight;
                pixels[base + 2] = b / totalWeight;
                pixels[base + 3] = 255; // Alpha channel
            }
        }
        renderCtx.putImageData(imageData, 0, 0);

        if (isLowQuality) {
            targetCtx.save();
            const bleed = 0.1;
            const bleedX = width * bleed;
            const bleedY = height * bleed;
            const blurAmount = Math.min(width, height) * 0.04;
            targetCtx.filter = `blur(${blurAmount}px)`;
            targetCtx.drawImage(renderCanvas, -bleedX, -bleedY, width + bleedX * 2, height + bleedY * 2);
            targetCtx.restore();
        }
    }

    // --- Main Draw Call ---
    function redrawCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        renderGradientToCanvas(canvas, colorPoints);

        if (isDraggingEnabled) {
            ctx.filter = 'none';
            ctx.globalCompositeOperation = 'source-over';
            colorPoints.forEach(point => {
                // Draw main color point handle
                ctx.beginPath();
                ctx.arc(point.x, point.y, 10, 0, 2 * Math.PI);
                ctx.fillStyle = point.color;
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.lineWidth = 2;
                ctx.fill();
                ctx.stroke();

                // Draw radius control handle on hover
                if (point === hoveredPoint) {
                    // Draw the radius outline
                    ctx.beginPath();
                    ctx.arc(point.x, point.y, point.radius, 0, 2 * Math.PI);
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
                    ctx.lineWidth = 1;
                    ctx.setLineDash([4, 4]);
                    ctx.stroke();
                    ctx.setLineDash([]);

                }
            });
        }
    }

    // --- UI & Interaction ---
    function updateColorPointUI() {
        colorPointsContainer.innerHTML = '';
        colorPoints.forEach(point => {
            const pointEl = document.createElement('div');
            pointEl.className = 'color-point';

            const colorDisplay = document.createElement('div');
            colorDisplay.className = 'color-display';
            colorDisplay.style.backgroundColor = point.color;

            const colorInput = document.createElement('input');
            colorInput.type = 'color';
            colorInput.value = point.color;

            colorInput.addEventListener('input', (e) => {
                point.color = e.target.value;
                colorDisplay.style.backgroundColor = point.color;
                updateSelectedPalette('Custom');
                redrawCanvas();
            });

            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-color-btn';
            removeBtn.innerHTML = '&times;';
            removeBtn.addEventListener('click', () => removeColorPoint(point.id));

            pointEl.appendChild(colorInput);
            pointEl.appendChild(colorDisplay);
            pointEl.appendChild(removeBtn); // Add the remove button
            colorPointsContainer.appendChild(pointEl);
        });
    }

    // --- State Management & Randomization ---
    function addColorPoint() {
        if (colorPoints.length >= 10) return;
        const newPoint = {
            id: Date.now(),
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            color: getRandomColor(),
            radius: Math.random() * 150 + (canvas.width * 0.6),
        };
        colorPoints.push(newPoint);
        updateSelectedPalette('Custom');
        updateColorPointUI();
        redrawCanvas();
    }

    function removeColorPoint(id) {
        if (colorPoints.length <= 2) return;
        colorPoints = colorPoints.filter(p => p.id !== id);
        updateSelectedPalette('Custom');
        updateColorPointUI();
        redrawCanvas();
    }

    function randomizePositions() {
        const { width, height } = canvas;

        // Define regions to ensure better coverage and prevent empty corners
        const regions = [
            // Corners
            { x: [0, 0.25], y: [0, 0.25] },     // Top-left
            { x: [0.75, 1], y: [0, 0.25] },     // Top-right
            { x: [0, 0.25], y: [0.75, 1] },     // Bottom-left
            { x: [0.75, 1], y: [0.75, 1] },     // Bottom-right
            // Edges & Center
            { x: [0.4, 0.6], y: [0, 0.2] },      // Top-center
            { x: [0.4, 0.6], y: [0.8, 1] },      // Bottom-center
            { x: [0, 0.2],   y: [0.4, 0.6] },    // Left-center
            { x: [0.8, 1],   y: [0.4, 0.6] },    // Right-center
            { x: [0.25, 0.75], y: [0.25, 0.75] } // Center area
        ];

        // Shuffle regions to ensure variety
        for (let i = regions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [regions[i], regions[j]] = [regions[j], regions[i]];
        }

        colorPoints.forEach((point, index) => {
            const region = regions[index % regions.length];
            const minX = region.x[0] * width;
            const maxX = region.x[1] * width;
            const minY = region.y[0] * height;
            const maxY = region.y[1] * height;

            point.x = Math.random() * (maxX - minX) + minX;
            point.y = Math.random() * (maxY - minY) + minY;
            point.radius = Math.random() * (width / 4) + (width / 4);
        });

        redrawCanvas();
    }

    function randomizeColors() {
        colorPoints.forEach(point => {
            point.color = getRandomColor();
        });
        updateSelectedPalette('Custom');
        updateColorPointUI();
        redrawCanvas();
    }

    function applyPalette(paletteName) {
        const colors = COLOR_PALETTES[paletteName];
        if (!colors) return;

        if (colors.length > 0) {
            colorPoints = colors.map((color, i) => ({
                id: Date.now() + i,
                x: 0, y: 0,
                color: color,
                radius: 0,
            }));
        }

        randomizePositions();
        updateSelectedPalette(paletteName);
        updateColorPointUI();
        redrawCanvas();
    }

    function updateSelectedPalette(paletteName) {
        const triggerSpan = selectTrigger.querySelector('span');
        const triggerSwatch = selectTrigger.querySelector('.palette-swatch');

        if (triggerSwatch) triggerSwatch.remove();

        const colors = COLOR_PALETTES[paletteName];
        if (colors && colors.length > 0) {
            const swatch = createPaletteSwatch(colors);
            selectTrigger.prepend(swatch);
            triggerSpan.textContent = paletteName;
        } else {
            triggerSpan.textContent = 'Custom';
        }

        // Update selected state in dropdown
        document.querySelectorAll('.custom-option').forEach(opt => {
            opt.classList.toggle('selected', opt.dataset.value === paletteName);
        });
    }


    // --- Canvas Mouse Events ---
    canvas.addEventListener('mousedown', (e) => {
        if (!isDraggingEnabled) return;

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const mouseX = (e.clientX - rect.left) * scaleX;
        const mouseY = (e.clientY - rect.top) * scaleY;

        // Check for resize or drag, starting from the top-most point
        for (let i = colorPoints.length - 1; i >= 0; i--) {
            const point = colorPoints[i];
            const dx = mouseX - point.x;
            const dy = mouseY - point.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Check if the click is on the radius outline for resizing
            if (Math.abs(dist - point.radius) < 10) { // 10px tolerance for resizing
                resizingPoint = point;
                draggingPoint = null;
                canvas.style.cursor = 'nwse-resize';
                return;
            }

            // Check if the click is on the center handle for dragging
            if (dist < 10) { // 10px tolerance for dragging
                draggingPoint = point;
                resizingPoint = null;
                canvas.style.cursor = 'grabbing';
                return;
            }
        }
    });

    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const mouseX = (e.clientX - rect.left) * scaleX;
        const mouseY = (e.clientY - rect.top) * scaleY;

        if (resizingPoint) {
            const dx = mouseX - resizingPoint.x;
            const dy = mouseY - resizingPoint.y;
            resizingPoint.radius = Math.max(20, Math.sqrt(dx * dx + dy * dy)); // Min radius
            redrawCanvas();
            return;
        }

        if (draggingPoint) {
            draggingPoint.x = mouseX;
            draggingPoint.y = mouseY;
            redrawCanvas();
            return;
        }

        // Hover detection
        if (!isDraggingEnabled) return;

        let foundPoint = null;
        let onResizeHandle = false;
        for (const point of colorPoints) {
            const dx = mouseX - point.x;
            const dy = mouseY - point.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 10) { // Hovering over the center handle
                foundPoint = point;
                onResizeHandle = false;
                break;
            }
            if (Math.abs(dist - point.radius) < 10) { // Hovering over the radius outline
                foundPoint = point;
                onResizeHandle = true;
                break;
            }
        }

        if (hoveredPoint !== foundPoint || (hoveredPoint === foundPoint && onResizeHandle !== (canvas.style.cursor === 'nwse-resize'))) {
            hoveredPoint = foundPoint;
            if (hoveredPoint) {
                if (onResizeHandle) {
                    canvas.style.cursor = 'nwse-resize';
                } else {
                    canvas.style.cursor = 'grab';
                }
            } else {
                 canvas.style.cursor = 'grab';
            }
            redrawCanvas();
        }
    });

    canvas.addEventListener('mouseup', () => {
        draggingPoint = null;
        resizingPoint = null;
        canvas.style.cursor = isDraggingEnabled ? 'grab' : 'default';
    });

    canvas.addEventListener('mouseleave', () => {
        if (draggingPoint) {
            draggingPoint = null;
            canvas.style.cursor = isDraggingEnabled ? 'grab' : 'default';
        }
    });

    // --- Export ---
    function downloadImage(format) {
        const width = parseInt(resWidthInput.value, 10);
        const height = parseInt(resHeightInput.value, 10);

        if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
            alert("Please enter valid width and height.");
            return;
        }

        // --- Loading Indicator ---
        const downloadBtn = document.getElementById('download-jpg-btn');
        const originalText = downloadBtn.textContent;
        downloadBtn.textContent = 'Rendering...';
        downloadBtn.disabled = true;

        // Use a timeout to allow the UI to update before the heavy computation begins
        setTimeout(() => {
            const offscreenCanvas = document.createElement('canvas');
            offscreenCanvas.width = width;
            offscreenCanvas.height = height;

            const scaleX = width / canvas.width;
            const scaleY = height / canvas.height;
            const radiusScale = Math.sqrt(scaleX * scaleY);

            const scaledPoints = colorPoints.map(p => ({
                ...p,
                x: p.x * scaleX,
                y: p.y * scaleY,
                radius: p.radius * radiusScale
            }));

            // --- Render in High Quality ---
            renderGradientToCanvas(offscreenCanvas, scaledPoints, 'high');

            offscreenCanvas.toBlob((blob) => {
                const link = document.createElement('a');
                link.download = `gradient-${Date.now()}.${format}`;
                link.href = URL.createObjectURL(blob);
                link.click();
                URL.revokeObjectURL(link.href);

                // Restore button state
                downloadBtn.textContent = originalText;
                downloadBtn.disabled = false;
            }, `image/${format}`, 1.0); // Use 1.0 quality for best results
        }, 10);
    }

    // --- Utility & Initialization ---
    function getRandomColor() {
        return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    }

    function createPaletteSwatch(colors) {
        const swatch = document.createElement('div');
        swatch.className = 'palette-swatch';
        colors.forEach(color => {
            const colorEl = document.createElement('div');
            colorEl.className = 'swatch-color';
            colorEl.style.backgroundColor = color;
            swatch.appendChild(colorEl);
        });
        return swatch;
    }

    function populatePaletteSelect() {
        for (const paletteName in COLOR_PALETTES) {
            if (paletteName === "Custom") continue;
            const colors = COLOR_PALETTES[paletteName];
            const option = document.createElement('div');
            option.className = 'custom-option';
            option.dataset.value = paletteName;

            option.appendChild(createPaletteSwatch(colors));

            const span = document.createElement('span');
            span.textContent = paletteName;
            option.appendChild(span);

            option.addEventListener('click', () => {
                applyPalette(paletteName);
                customSelect.classList.remove('open');
            });
            customOptions.appendChild(option);
        }
    }

    // --- Initialization ---
    refreshShapeBtn.addEventListener('click', randomizePositions);
    randomizeColorsBtn.addEventListener('click', randomizeColors);
    addColorPointBtn.addEventListener('click', addColorPoint);

    adjustPositionToggle.addEventListener('change', (e) => {
        isDraggingEnabled = e.target.checked;
        canvas.style.cursor = isDraggingEnabled ? 'grab' : 'default';
        redrawCanvas();
    });

    downloadJpgBtn.addEventListener('click', () => downloadImage('jpeg'));

    document.querySelectorAll('.preset-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const { width, height } = e.target.dataset;
            resWidthInput.value = width;
            resHeightInput.value = height;
        });
    });

    selectTrigger.addEventListener('click', () => {
        customSelect.classList.toggle('open');
    });

    window.addEventListener('click', (e) => {
        if (!customSelect.contains(e.target)) {
            customSelect.classList.remove('open');
        }
    });

    populatePaletteSelect();
    const firstPalette = Object.keys(COLOR_PALETTES)[0];
    applyPalette(firstPalette);
});

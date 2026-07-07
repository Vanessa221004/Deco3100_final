// I explained how the code works and how I adapted it in the Appendix D: AI acknowledgement
// For all of the codex base code, please refer to every .md file in the zip file. 

document.addEventListener("DOMContentLoaded", () => {
    gsap.registerPlugin(ScrollTrigger, SplitText); //register plugins from GSAp for scroll-based animations and text splitting

    //using base code from claude, but i adapted and expanded it a lot to fit the needs of my project, and added more comments to explain how it works, and also added some new features like the quote navigation and the chart animations, to make the final presentation more engaging and interactive for the users, while still maintaining a smooth and cohesive experience throughout the page.
    //find the elements we need to manipulate for the cloud animation and text reveals
    const cloudWrap = document.querySelector(".cloud-wrap");
    const scrollSection = document.querySelector(".scroll-section");
    const textBox = document.querySelector(".text-box");
    const cloudPlaceholder = document.querySelector(".cloud-placeholder");

    const getCloudTranslateValue = (property) => { //asking the value of cloudWrap's current transform position, return 0 if it's not a number
        const value = Number(gsap.getProperty(cloudWrap, property));
        return Number.isFinite(value) ? value : 0;
    };

    const getCloudTranslate = () => ({ //get both x and y values of the cloud's current position
        x: getCloudTranslateValue("x"),
        y: getCloudTranslateValue("y"),
    });

    const moveCloudTo = (targetState) => { //animate the cloud to a specific/target position with a smooth transition, and overwrite any previous conflicting animations
        gsap.to(cloudWrap, {
            ...targetState,
            duration: 1,
            ease: "power1.inOut", //use a smooth easing function for a more natural movement, from start to end of the animation instead of timing it
            overwrite: "auto",//If another animation is still running, replace it properly instead of error
        });
    };

    let cloudBoxState = { x: 0, y: 0 }; //store the cloud's position starts at { x: 0, y: 0 } as a safe default, so we can scroll it there later

    //using code base from claude and also GSAP scroll-trigger
    gsap.set(".scroll-sentence", { autoAlpha: 1 }); //make sure the scroll sentence is visible before splitting, otherwise SplitText will calculate wrong positions for the words and cause animation issues

    const split = SplitText.create(".scroll-sentence", {
        type: "words",
        wordsClass: "scroll-word",
    }); //split the scroll sentence into words and wrap each word in a span with class "scroll-word" for individual animation control

    gsap.set(split.words, { autoAlpha: 0, y: 80 }); //initially hide all the words and position them 80px below their original position, so they can animate upwards into view when revealed

    const revealTimeline = gsap.timeline({ // creates a sequence of animations for revealing the scroll sentence and moving the cloud, all controlled by the scroll position of the ".stage" section
        scrollTrigger: {
            trigger: ".stage",
            start: "top top", // when the top of the ".stage" section hits the top of the viewport
            end: "+=1100", // the animation will continue for 1100px of scrolling after the start point, which should be enough to reveal the sentence and move the cloud to its target position
            scrub: true, // it will play forward and backward as the user scrolls up and down
            pin: true, // it will pin the ".stage" section in place during the animation, so the content inside can animate while the background stays fixed
            markers: false,
            invalidateOnRefresh: true, // it will recalculate the start and end positions if the window is resized or content changes, ensuring the animation stays in sync with the scroll position
        },
    });

    revealTimeline.to(split.words, {  // animate the words to fade in and move up into their original position (80px up), with a staggered delay between each word for a cascading effect
        autoAlpha: 1,
        y: 0,
        stagger: 0.05,
        ease: "none",
    });

    revealTimeline.addLabel("sentenceEnd"); // add a label at the end of the sentence reveal animation, named it "sentenceEnd", so we can synchronize the cloud movement to start right after the sentence is fully revealed

    //using codex to calculate the target position for the cloud based on the positions of the cloud and the text box, and ensure it stays within the viewport, so it will move towards the text box but won't go off-screen or below the bottom of the screen, creating a smooth and visually appealing animation that guides the user's attention to the text box as they scroll through the section.
    //cloud animation that moves the cloud from its initial position to a target position near the text box, calculated based on the positions of the cloud and the text box, and constrained to stay within the viewport
    if (cloudWrap && scrollSection) {
        revealTimeline.to(cloudWrap, { //add this animation when the timeline reaches the "sentenceEnd" label, so it starts right after the sentence is fully revealed
            y: () => { // calculate the target y position for the cloud based on the positions of the cloud and the text box, and ensure it doesn't go off-screen
                const cloudRect = cloudWrap.getBoundingClientRect(); // get the current position and size of the cloud
                const targetRect = textBox?.getBoundingClientRect() ?? scrollSection.getBoundingClientRect();
                const lowestVisibleTop = window.innerHeight - cloudRect.height - 32;  //dont let the cloud go below the screen or the bottom
                const targetTop = Math.min(targetRect.top - cloudRect.height - 16, lowestVisibleTop);
                return Math.max(0, targetTop - cloudRect.top);
            },
            duration: 0.8,
            ease: "none",
        }, "sentenceEnd");
    }
    //The code waits until the sentence finishes revealing, then moves the cloud toward the text box while keeping it fully visible and inside the screen boundaries.

    //using code base from claude and also GSAP scroll-trigger
    const boxSplit = SplitText.create(".box-sentence", {
        type: "words",
        wordsClass: "box-word",
    });
    //same logic like above, where i will use the plugin to slip word by word

    gsap.set(boxSplit.words, { autoAlpha: 0, y: 32 }); //push up down 32 px to create a subtle upward movement when they animate into view, and set autoAlpha to 0 to make them invisible until the animation starts

    // animate the words in the text box to fade in and move up into their original position, with a staggered delay between each word, triggered by scrolling the ".text-box" section into view, starting when the top of the text box is near the bottom of the viewport and ending when it's closer to the middle, with scrub enabled for smooth animation tied to scroll position
    gsap.to(boxSplit.words, {
        autoAlpha: 1,
        y: 0,
        stagger: 0.04,
        ease: "none",
        scrollTrigger: {
            trigger: ".text-box",
            start: "top 92%",
            end: "top 65%",
            scrub: true,
            markers: false,
        },
    });

    //using code base from claude and also GSAP scroll-trigger
    //scroll trigger to move the cloud to the placeholder position when leaving the text box, and move it back to the original position when scrolling back up, ensuring the cloud follows the user through the section and returns to its starting point when they go back up
    if (cloudWrap && textBox && cloudPlaceholder) {
        ScrollTrigger.create({
            trigger: textBox,
            start: "top 92%",
            end: "top 65%",
            markers: false,
            onLeave: () => {
                const placeholderRect = cloudPlaceholder.getBoundingClientRect();
                const cloudRect = cloudWrap.getBoundingClientRect();

                cloudBoxState = getCloudTranslate();
                moveCloudTo({
                    x: placeholderRect.left + (placeholderRect.width / 2) - (cloudRect.left + (cloudRect.width / 2)) - 45,
                    y: placeholderRect.top + (placeholderRect.height / 2) - (cloudRect.top + (cloudRect.height / 2)) + 400,
                });
            },
            onEnterBack: () => { //have this to make sure it will scroll back up
                moveCloudTo(cloudBoxState);
            },
        });
    }

    //using code base from claude and adjusted it to match the aesthetic of the webpage
    //horizontal scroll section, where the horizontal track will scroll left as the user scrolls down, creating a horizontal scrolling effect while the section is pinned in place, and it will automatically adjust the end point based on the width of the track and the viewport to ensure it scrolls through the entire content
    const hSection = document.getElementById('horizontalSection');
    const hTrack = document.getElementById('horizontalTrack');

    // Horizontal scroll: only active on screens wider than 760px.
    // On mobile the track stacks vertically via CSS (flex-direction: column)
    // and transform: none !important overrides any GSAP inline style.
    const setupHorizontalScroll = () => {
        if (!hSection || !hTrack) return;

        const isMobile = window.innerWidth <= 760;

        if (isMobile) {
            // Kill any existing ScrollTrigger for this section and reset position
            ScrollTrigger.getAll()
                .filter(t => t.trigger === hSection)
                .forEach(t => t.kill());
            gsap.set(hTrack, { x: 0, clearProps: "transform" });
            return;
        }

        // Desktop: set up (or re-set up) horizontal scroll
        gsap.to(hTrack, {
            x: () => -(hTrack.scrollWidth - window.innerWidth),
            ease: "none",
            scrollTrigger: {
                trigger: hSection,
                start: "top top",
                end: () => `+=${hTrack.scrollWidth - window.innerWidth}`,
                scrub: 1,
                pin: true,
                invalidateOnRefresh: true,
            }
        });
    };

    setupHorizontalScroll();

    // Re-evaluate on resize (e.g. rotating a tablet)
    let resizeTimer;
    window.addEventListener("resize", () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            ScrollTrigger.refresh();
            setupHorizontalScroll();
        }, 250);
    });

//using code base from claude and adjusted it to match the aesthetic of the webpage
    const quoteTextUts = document.getElementById("quoteText-uts");
    const quoteTextScu = document.getElementById("quoteText-scu");
    const quoteCounterUts = document.getElementById("quoteCounter-uts");
    const quoteCounterScu = document.getElementById("quoteCounter-scu");
    const quoteSourceUts = document.getElementById("quoteSource-uts");
    const quoteSourceScu = document.getElementById("quoteSource-scu");

    const quotes = {
        uts: [
            "Equity, diversity and inclusion are core to UTS's values.",
            "Our Educational Access Schemes acknowledge diverse educational experiences, and support students through an equitable admission process.",
            "UTS had “temporarily suspended” new ARTs student enrolments - Andrew Parfitt, Vice Chancellor of UTS"
        ],
        scu: [
            "Our Southern Cross ... covering a diverse academic spectrum that includes business, creative arts, education, engineering, health, humanities, Indigenous knowledge, information technology, law, science, social work, and tourism.",
            "We draw on the creative talents of our staff, students and stakeholders and their commitment and passion to address the needs of communities.",
            "SCU will no longer offer a standalone Bachelor of Arts, or degrees in contemporary music, art and design, or digital media...The cost of a degree like this, set against the cost of a degree in teaching or nursing, is quite radically different and much more expensive\n- Vice-chancellor Tyrone Carlin"
        ]
    };

    const quoteIndex = {
        uts: 0,
        scu: 0,
    };

    const quoteSources = {
        uts: [
            "source. University Of Technology Sydney 2023–2027 Strategy",
            "source. University Of Technology Sydney 2023–2027 Strategy",
            "source. Disalvo, 2025"
        ],
        scu: [
            "source. Southern Cross University Strategy",
            "source. Southern Cross University Strategy",
            "source. Rennie, 2024"
        ]
    };

// using base code from codex and claude
    //function to update the quote text based on the current index for each university, and set it to the corresponding text element in the HTML, ensuring it displays the correct quote when the user clicks the buttons to navigate through the quotes
    const setQuoteText = (target) => {
        const textElement = target === "uts" ? quoteTextUts : quoteTextScu;
        const counterElement = target === "uts" ? quoteCounterUts : quoteCounterScu;
        if (!textElement) return;
        textElement.textContent = quotes[target][quoteIndex[target]] || "";
        if (counterElement) {
            counterElement.textContent = `${quoteIndex[target] + 1}/${quotes[target].length}`;
        }
        if (target === "uts" && quoteSourceUts) {
            quoteSourceUts.textContent = quoteSources.uts[quoteIndex.uts] || "";
        }
        if (target === "scu" && quoteSourceScu) {
            quoteSourceScu.textContent = quoteSources.scu[quoteIndex.scu] || "";
        }
    };

    //function to handle the quote navigation when the user clicks the buttons, it updates the quote index based on the direction (previous or next) and wraps around if it goes out of bounds, then calls setQuoteText to update the displayed quote accordingly
    const updateQuote = (target, dir) => {
        if (!quotes[target]) return;
        quoteIndex[target] = (quoteIndex[target] + dir + quotes[target].length) % quotes[target].length;
        setQuoteText(target);
    };

    //add event listeners to the quote navigation buttons, when clicked, it retrieves the target university and direction from the button's data attributes, then calls updateQuote to change the displayed quote based on the user's navigation input
    document.querySelectorAll(".quote-btn").forEach((button) => {
        button.addEventListener("click", () => {
            const target = button.dataset.target;
            const dir = Number(button.dataset.dir) || 0;
            updateQuote(target, dir);
        });
    });

    setQuoteText("uts");
    setQuoteText("scu");

//using code base from codex
//utility function to create a deep copy of chart values, ensuring that when we manipulate the traces for animations, we don't accidentally modify the original data or layout objects, which could lead to unintended side effects in the charts, allowing us to safely create variations of the chart data for different animation frames without affecting the original configuration
    const cloneChartValue = (value) => {
        if (Array.isArray(value)) return value.slice();
        if (value && typeof value === "object") return { ...value };
        return value;
    };

    const cloneChartAnnotations = (annotations) => annotations.map(annotation => ({
        ...annotation,
        font: annotation.font ? { ...annotation.font } : annotation.font,
    }));

    const legendHintText = 'Double-click a legend item to isolate one data series.';
    const mapHintText = 'Hover over a dot to inspect each university cut.';

//function to create annotations for the charts, such as hints for interacting with the legend or map, and also utility functions to determine if an annotation is part of the chart's chrome (i.e. not data-related), and to prepare the traces and layout for a line reveal animation, allowing for a dynamic and engaging presentation of the data visualizations on the webpage
    const getLegendHintAnnotation = (color, y = 1.18) => ({
        text: legendHintText,
        showarrow: false,
        x: 0.5,
        xref: 'paper',
        xanchor: 'center',
        y,
        yref: 'paper',
        yanchor: 'bottom',
        font: { family: '"Crimson Text", serif', size: 15, color },
        opacity: 0.78,
    });

//this is for the map hint annotation, which will be used in the map chart to provide a hint for users to interact with the map, and it will be styled to match the aesthetic of the webpage, with a specific position and font styling to ensure it is noticeable but not intrusive, enhancing the user experience by guiding them on how to explore the data visualization effectively
    const getMapHintAnnotation = () => ({
        text: mapHintText,
        showarrow: false,
        x: 0.51,
        xref: 'paper',
        xanchor: 'center',
        y: 1.02,
        yref: 'paper',
        yanchor: 'bottom',
        font: { family: '"Crimson Text", serif', size: 15, color: '#EADFC4' },
        opacity: 0.72,
    });

    //code base in codex
    //create a line reveal animation for the charts, where the data points will be revealed progressively over time as the user scrolls through the section, and it will also handle the visibility of annotations based on the specified options, allowing for a dynamic and engaging presentation of the data visualizations on the webpage, while ensuring that the chart remains visually appealing and informative throughout the animation process
    //utility function to determine if an annotation is part of the chart's chrome (i.e. not data-related), which checks if the annotation's xref and yref properties are set to 'paper', indicating that it is positioned relative to the entire chart area rather than specific data points, allowing us to differentiate between annotations that are meant for user guidance or decoration and those that are tied to the data, which is important for managing their visibility during animations or interactions
    const isChartChromeAnnotation = (annotation) => annotation.xref === 'paper' && annotation.yref === 'paper';

    //utility function to count the number of data points in the traces for a line reveal animation, which iterates through the traces and checks if the x property is an array, returning the length of the longest x array found, allowing us to determine how many frames we need to create for the line reveal animation to progressively show the data points over time
    const getLineRevealTraceCount = (traces) => Math.max(
        ...traces.map(trace => Array.isArray(trace.x) ? trace.x.length : 0)
    );

    //utility function to prepare the traces for a line reveal animation, which takes the original traces and a visible count, and returns new traces where the x and y arrays are sliced to show only up to the visible count of data points, while also cloning any other properties to ensure we don't modify the original traces, allowing us to create intermediate frames for the animation that progressively reveal more of the data points as the user scrolls through the section
    const getLineRevealTraces = (traces, visibleCount) => traces.map((trace) => {
        const nextTrace = {};

        Object.keys(trace).forEach((key) => {
            const value = trace[key];
            nextTrace[key] = Array.isArray(value) ? value.slice(0, visibleCount) : cloneChartValue(value);
        });

        return nextTrace;
    });

    //utility function to prepare the layout for a line reveal animation, which takes the original layout, the traces, the visible count, and an option for how to handle annotation visibility, and returns a new layout that may adjust the x and y axis ranges based on the data points being revealed, and also manages the visibility of annotations based on whether they are part of the chart's chrome or not, allowing us to ensure that the layout remains visually appealing and informative throughout the animation process as more data points are revealed
    const getLineRevealLayout = (layout, traces, visibleCount, annotationReveal = "progressive") => {
        const firstX = traces.find(trace => Array.isArray(trace.x))?.x || [];
        const allYValues = traces
            .flatMap(trace => Array.isArray(trace.y) ? trace.y : [])
            .filter(value => Number.isFinite(value));
        const totalPoints = getLineRevealTraceCount(traces);
        const nextLayout = {
            ...layout,
            xaxis: layout.xaxis ? { ...layout.xaxis } : {},
            yaxis: layout.yaxis ? { ...layout.yaxis } : {},
        };
//handle annotation visibility based on the specified option, if it's set to "after", only show the chart chrome annotations after the animation is complete, otherwise show all annotations progressively with the data points, ensuring that user guidance and decorative annotations are displayed according to the desired timing in relation to the data reveal
        if (Array.isArray(layout.annotations)) {
            if (annotationReveal === "after") {
                nextLayout.annotations = cloneChartAnnotations(layout.annotations.filter(isChartChromeAnnotation));
            } else {
                nextLayout.annotations = cloneChartAnnotations(layout.annotations);
            }
        }

        //adjust the x-axis type and range if the x values are strings (categorical) or if they are numbers, ensuring that the x-axis is properly configured to display the data points as they are revealed during the animation
        if (firstX.length && typeof firstX[0] === "string") {
            nextLayout.xaxis.type = "category";
            nextLayout.xaxis.categoryorder = "array";
            nextLayout.xaxis.categoryarray = firstX;
            nextLayout.xaxis.range = [-0.5, firstX.length - 0.5];
        } else if (firstX.length && !nextLayout.xaxis.range) {
            nextLayout.xaxis.range = [d3.min(firstX), d3.max(firstX)];
        }

        //adjust the y-axis range to ensure it accommodates the data points being revealed, with some padding for visual appeal, and also consider the rangemode setting to determine if the range should start at zero or not, ensuring that the y-axis is properly scaled to display the data points as they are revealed during the animation
        if (allYValues.length && !nextLayout.yaxis.range) {
            const yMin = d3.min(allYValues);
            const yMax = d3.max(allYValues);
            const shouldStartAtZero = nextLayout.yaxis.rangemode === "tozero" || yMin >= 0;
            const rangeMin = shouldStartAtZero ? 0 : yMin;
            const padding = Math.max((yMax - rangeMin) * 0.12, 1);

            nextLayout.yaxis.range = [rangeMin, yMax + padding];
        }

        return nextLayout;
    };

    //Using codex code
    //main function to create a line reveal animation for a chart, which sets up the necessary state and scroll triggers to progressively reveal the data points in the traces as the user scrolls through the section, while also managing the visibility of annotations based on the specified options, allowing for a dynamic and engaging presentation of the data visualizations on the webpage
    const createLineRevealChart = (chartId, traces, layout, config = {}, options = {}) => {
        const chartElement = document.getElementById(chartId);
        if (!chartElement) return;

        const totalPoints = getLineRevealTraceCount(traces);
        if (!totalPoints) {
            Plotly.newPlot(chartId, traces, layout, config);
            return;
        }
//set up the initial state for the animation, including the starting count of visible data points, the delay between frames, and the option for how to handle annotation visibility, as well as variables to manage the animation timer and token for controlling the animation flow, allowing us to create a structured approach to animating the chart as the user scrolls through the section
        const startCount = options.startCount || 1;
        const frameDelay = options.frameDelay || 95;
        const annotationReveal = options.annotationReveal || "progressive";
        let animationTimer = null;
        let animationToken = 0;

        //function to render a specific frame of the animation based on the visible count of data points, which updates the chart using Plotly.react with the prepared traces and layout for that frame, allowing us to progressively reveal more data points as the user scrolls through the section
        const renderFrame = (visibleCount) => Plotly.react(
            chartElement,
            getLineRevealTraces(traces, visibleCount),
            getLineRevealLayout(layout, traces, visibleCount, annotationReveal),
            config
        );
//function to render the complete chart with all data points visible, which can be called at the end of the animation or when the user scrolls back up, ensuring that the full data visualization is displayed when the animation is complete or when the user wants to see all the data points at once
        const renderCompleteChart = () => Plotly.react(
            chartElement,
            traces,
            getLineRevealLayout(layout, traces, totalPoints, "always"),
            config
        );
//function to stop the animation, which increments the animation token to invalidate any ongoing animation frames and clears the animation timer if it exists, allowing us to immediately halt the animation when the user scrolls out of the section or when we need to reset the chart, ensuring that the animation does not continue running in the background and cause performance issues or unintended visual effects
        const stopAnimation = () => {
            animationToken += 1;
            if (animationTimer) {
                clearTimeout(animationTimer);
                animationTimer = null;
            }
        };
//function to reset the chart to its initial state, which stops any ongoing animation and renders the frame with the starting count of visible data points, and also manages the visibility of annotations based on the specified options, allowing us to return the chart to its initial state when the user scrolls back up or when we need to reset the animation for any reason
        const resetChart = () => {
            stopAnimation();
            renderFrame(startCount).then(() => {
                if (annotationReveal === "after" && Array.isArray(layout.annotations)) {
                    Plotly.relayout(chartElement, {
                        annotations: cloneChartAnnotations(layout.annotations.filter(isChartChromeAnnotation)),
                    });
                }
            });
        };
//function to animate the chart by progressively revealing the data points, which uses a recursive approach with setTimeout to create a frame-by-frame animation effect, and also manages the visibility of annotations based on the specified options, allowing us to create a dynamic and engaging presentation of the data visualizations on the webpage as the user scrolls through the sections
        const animateChart = () => {
            stopAnimation();
            const currentToken = animationToken;
            let visibleCount = startCount;
//function to draw the next frame of the animation, which checks if the animation token is still valid, determines if the animation is complete based on the visible count of data points, and either renders the final frame or continues to render the next frame with an incremented visible count after a delay, allowing us to create a smooth and progressive reveal of the data points in the chart as the user scrolls through the section
            const drawNextFrame = () => {
                if (currentToken !== animationToken) return;

                const isComplete = visibleCount >= totalPoints; //check if the animation is complete by comparing the visible count of data points to the total number of data points in the traces, allowing us to determine when to stop the animation and render the complete chart

                //if the animation is complete, render the final frame with all data points visible, and also manage the visibility of annotations based on the specified options, ensuring that the full data visualization is displayed when the animation is complete and that any chart chrome annotations are shown if they were set to be revealed after the animation
                if (isComplete) {
                    const finalFrame = annotationReveal === "after" && Array.isArray(layout.annotations)
                        ? renderCompleteChart()
                        : renderFrame(visibleCount);

                        //after rendering the final frame, check if the animation token is still valid and clear the animation timer if it exists, ensuring that we properly clean up the animation state after the animation is complete to prevent any unintended effects or performance issues
                    finalFrame.then(() => {
                        if (currentToken === animationToken) {
                            animationTimer = null;
                        }
                    });
                    return;
                }
//if the animation is not complete, render the next frame with the current visible count of data points, and then schedule the next frame after a delay, allowing us to create a smooth and progressive reveal of the data points in the chart as the user scrolls through the section
                renderFrame(visibleCount).then(() => {
                    if (currentToken === animationToken) {
                        visibleCount += 1;
                        animationTimer = setTimeout(drawNextFrame, frameDelay);
                    }
                });
            };

            drawNextFrame(); //start the animation by drawing the first frame, and then continue to draw subsequent frames until the animation is complete, allowing us to create a dynamic and engaging presentation of the data visualizations on the webpage as the user scrolls through the sections
        };

        renderFrame(startCount); //render the initial frame of the chart with the starting count of visible data points, allowing us to set up the initial state of the chart before the animation begins as the user scrolls through the section

        //set up an intersection observer to trigger the animation when the chart element comes into view, and to reset the chart when it goes out of view, ensuring that the animation plays at the appropriate times as the user scrolls through the sections and that the chart resets when they scroll back up or away from the section
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    animateChart();
                } else {
                    resetChart();
                }
            });
        }, {
            threshold: options.threshold || 0.45,
        });

        observer.observe(chartElement);

        return { animateChart, resetChart };
    };

    //  using code base from codex
    //function to create a bar rise animation for a chart, where the bars will grow in height from zero to their actual values as the user scrolls through the section, creating a dynamic and engaging presentation of the data visualizations on the webpage, while ensuring that the animation is smooth and visually appealing throughout the process
    const getBarRiseTraces = (traces, progress) => traces.map((trace) => ({
        ...trace,
        marker: cloneChartValue(trace.marker),
        y: Array.isArray(trace.y)
            ? trace.y.map(value => Number.isFinite(value) ? value * progress : value)
            : trace.y,
    }));
//function to create a bar rise animation for a chart, which sets up the necessary state and scroll triggers to animate the bars growing in height from zero to their actual values as the user scrolls through the section, allowing us to create a dynamic and engaging presentation of the data visualizations on the webpage
//similar explaination like above, i just changed it from line to bar and adjust the animation logic to scale the y values based on the progress of the animation, creating a smooth growth effect for the bars as they rise to their actual values during the animation
    const createBarRiseChart = (chartId, traces, layout, config = {}, options = {}) => {
        const chartElement = document.getElementById(chartId);
        if (!chartElement) return null;

        const duration = options.duration || 850;
        let animationFrame = null;
        let animationToken = 0;

        const renderFrame = (progress) => Plotly.react(
            chartElement,
            getBarRiseTraces(traces, progress),
            layout,
            config
        );

        const stopAnimation = () => {
            animationToken += 1;
            if (animationFrame) {
                cancelAnimationFrame(animationFrame);
                animationFrame = null;
            }
        };

        const resetChart = () => {
            stopAnimation();
            renderFrame(0);
        };

        const animateChart = () => {
            stopAnimation();
            const currentToken = animationToken;
            const startTime = performance.now();

            const drawNextFrame = () => {
                if (currentToken !== animationToken) return;

                const elapsed = performance.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const easedProgress = 1 - Math.pow(1 - progress, 3);

                renderFrame(easedProgress);

                if (progress < 1) {
                    animationFrame = requestAnimationFrame(drawNextFrame);
                } else {
                    renderFrame(1);
                    animationFrame = null;
                }
            };

            drawNextFrame();
        };

        renderFrame(0);

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    animateChart();
                } else {
                    resetChart();
                }
            });
        }, {
            threshold: options.threshold || 0.45,
        });

        observer.observe(chartElement);

        return { animateChart, resetChart };
    };

    //codex code base
    //function to create a scramble number animation for a text element, where the numbers will rapidly change to random digits before settling on the target value, creating a dynamic and engaging effect for displaying key statistics or figures on the webpage, while ensuring that the animation is smooth and visually appealing throughout the process
    const scrambleNumberText = (element, targetValue, options = {}) => {
        if (!element) return Promise.resolve();

        const duration = options.duration || 900;
        const frameDelay = options.frameDelay || 42;
        const isActive = options.isActive || (() => true);
        const startTime = performance.now();
        const targetText = Number(targetValue).toLocaleString("en-AU");
        const digitCount = targetText.replace(/\D/g, "").length;

        return new Promise((resolve) => {
            const drawScrambleFrame = () => {
                if (!isActive()) {
                    resolve();
                    return;
                }

                const elapsed = performance.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);

                if (progress >= 1) {
                    element.textContent = targetText;
                    resolve();
                    return;
                }

                const randomDigits = Array.from({ length: digitCount }, () => Math.floor(Math.random() * 10)).join("");
                element.textContent = Number(randomDigits).toLocaleString("en-AU");
                setTimeout(drawScrambleFrame, frameDelay);
            };

            drawScrambleFrame();
        });
    };

    //function to set up the scramble number animation for a set of counters within a container, where the numbers will scramble when the container comes into view and reset to placeholders when it goes out of view, allowing us to create an engaging effect for displaying key statistics or figures on the webpage as the user scrolls through the section, while ensuring that the animation is tied to the visibility of the container for optimal user experience
    const setupScrambleCounterOnView = (container, counters) => {
        if (!container) return;

        let scrambleToken = 0;

        const resetCounters = () => {
            scrambleToken += 1;
            counters.forEach(({ element }) => {
                if (element) element.textContent = "--";
            });
        };

        const runCounters = () => {
            scrambleToken += 1;
            const currentToken = scrambleToken;

            counters.forEach(({ element, value }) => {
                scrambleNumberText(element, value, {
                    isActive: () => currentToken === scrambleToken,
                }).then(() => {
                    if (currentToken === scrambleToken && element) {
                        element.textContent = Number(value).toLocaleString("en-AU");
                    }
                });
            });
        };

        // set up an intersection observer to trigger the scramble animation when the container comes into view, and to reset the counters when it goes out of view, ensuring that the animation plays at the appropriate times as the user scrolls through the section and that the counters reset when they scroll back up or away from the section
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    runCounters();
                } else {
                    resetCounters();
                }
            });
        }, {
            threshold: 0.5,
        });

        observer.observe(container);
    };

    //load the institution data from the CSV file and create the charts for University of Technology Sydney and Southern Cross University, showing the number of STEM and ART courses offered over time, with customized layouts, annotations, and hover interactions to highlight key trends and differences between the two universities
    d3.csv("institution.csv").then(data => {

        // CHART 1 - University of Technology Sydney (2016-2026)
        const utsData = data.filter(r => r['UTS ART'] !== '-');
        const utsYears = utsData.map(r => r.Year);
        const utsArt = utsData.map(r => +r['UTS ART']);
        const utsStem = utsData.map(r => +r['UTS STEM']);

        const utsTraces = [
            {
                x: utsYears,
                y: utsStem,
                name: 'STEMs Course',
                mode: 'lines+markers+text',
                line: { color: '#9EA4D7', width: 2.5, shape: 'spline' },
                marker: { color: '#9EA4D7', size: 6 },
                text: utsStem.map(String),
                textposition: 'top center',
                textfont: { size: 10, color: '#EADFC4' },
                hovertemplate: '<b>STEMs Course</b>: %{y}<extra></extra>',
            },
            {
                x: utsYears,
                y: utsArt,
                name: 'ARTs Course',
                mode: 'lines+markers+text',
                line: { color: '#D3B96D', width: 2.5, shape: 'spline' },
                marker: { color: '#D3B96D', size: 6 },
                text: utsArt.map(String),
                textposition: 'bottom center',
                textfont: { size: 10, color: '#EADFC4' },
                hovertemplate: '<b>ARTs Course</b>: %{y}<extra></extra>',
            }
        ];

        const utsLayout = {
            paper_bgcolor: '#2a0608',
            plot_bgcolor: '#2a0608',
            height: 500,
            font: { family: '"Crimson Text", serif', color: '#EADFC4', size: 12 },
            title: {
                text: 'Number of Courses Offered At University of Technology Sydney',
                font: { family: '"Crimson Text", serif', color: '#EADFC4', size: 22 },
                x: 0.46,
                xanchor: 'center',
                pad: { b: 64 },
            },
            xaxis: {
                gridcolor: 'rgba(234,223,196,0.08)',
                tickcolor: 'rgba(234,223,196,0.3)',
                linecolor: 'rgba(234,223,196,0.15)',
                tickfont: { color: 'rgba(234,223,196,0.6)' },
            },
            yaxis: {
                gridcolor: 'rgba(234,223,196,0.08)',
                tickcolor: 'rgba(234,223,196,0.3)',
                linecolor: 'rgba(234,223,196,0.15)',
                tickfont: { color: 'rgba(234,223,196,0.6)' },
                rangemode: 'tozero',
                range: [0, 240],
            },
            legend: {
                font: { size: 17, color: '#EADFC4' },
                bgcolor: 'rgba(0,0,0,0)',
                orientation: 'h',
                x: 0.46,
                xanchor: 'center',
                y: 0.96,
                yanchor: 'bottom',
            },
            margin: { t: 152, b: 70, l: 40, r: 40 },
            hovermode: 'x unified',
            hoverlabel: {
                bgcolor: '#3d0709',
                bordercolor: '#EADFC4',
                font: { family: '"Crimson Text", serif', color: '#EADFC4', size: 13 }
            },
            annotations: [
                getLegendHintAnnotation('#EADFC4', 1.13),
                {
                    x: '2021', y: 175,
                    text: 'STEM surges<br>+36 courses',
                    showarrow: true,
                    arrowhead: 2,
                    arrowcolor: '#EADFC4',
                    ax: 50, ay: -60,
                    font: { family: '"Crimson Text", serif', size: 12, color: '#141310' },
                    bgcolor: '#EADFC4',
                    bordercolor: '#EADFC4',
                    borderwidth: 1,
                    borderpad: 6,
                },
                {
                    x: '2025', y: 80,
                    text: 'ART drops to<br>lowest since 2016',
                    showarrow: true,
                    arrowhead: 2,
                    arrowcolor: '#D3B96D',
                    ax: -2, ay: 60,
                    font: { family: '"Crimson Text", serif', size: 12, color: '#141310' },
                    bgcolor: '#D3B96D',
                    bordercolor: '#D3B96D',
                    borderwidth: 1,
                    borderpad: 6,
                }
            ]
        };

        createLineRevealChart('chart-uts', utsTraces, utsLayout, {
            responsive: true,
            displayModeBar: false,
        }, {
            annotationReveal: "after",
        });


        // CHART 2 - Southern Cross University (2016-2026)
        const scuYears = data.map(r => r.Year);
        const scuArt = data.map(r => r['SCU ART'] !== '-' ? +r['SCU ART'] : null);
        const scuStem = data.map(r => r['SCU STEM'] !== '-' ? +r['SCU STEM'] : null);

        const scuTraces = [
            {
                x: scuYears,
                y: scuStem,
                name: 'STEMs Course',
                mode: 'lines+markers+text',
                connectgaps: true,
                line: { color: '#9EA4D7', width: 2.5, shape: 'spline' },
                marker: { color: '#9EA4D7', size: 6 },
                text: scuStem.map(v => v !== null ? String(v) : ''),
                textposition: 'top center',
                textfont: { size: 10, color: '#EADFC4' },
                hovertemplate: '<b>STEMs Course</b>: %{y}<extra></extra>',
            },
            {
                x: scuYears,
                y: scuArt,
                name: 'ARTs Course',
                mode: 'lines+markers+text',
                connectgaps: true,
                line: { color: '#D3B96D', width: 2.5, shape: 'spline' },
                marker: { color: '#D3B96D', size: 6 },
                text: scuArt.map(v => v !== null ? String(v) : ''),
                textposition: 'bottom center',
                textfont: { size: 10, color: '#EADFC4' },
                hovertemplate: '<b>ARTs Course</b>: %{y}<extra></extra>',
            }
        ];

        const scuLayout = {
            paper_bgcolor: '#2a0608',
            plot_bgcolor: '#2a0608',
            height: 500,
            font: { family: '"Crimson Text", serif', color: '#EADFC4', size: 12 },
            margin: { t: 152, b: 70, l: 40, r: 40 },
            title: {
                text: 'Number of Courses Offered At Southern Cross University',
                font: { family: '"Crimson Text", serif', color: '#EADFC4', size: 22 },
                x: 0.5,
                xanchor: 'center',
                pad: { b: 64 },
            },
            xaxis: {
                gridcolor: 'rgba(234,223,196,0.08)',
                tickcolor: 'rgba(234,223,196,0.3)',
                linecolor: 'rgba(234,223,196,0.15)',
                tickfont: { color: 'rgba(234,223,196,0.6)' },
            },
            yaxis: {
                gridcolor: 'rgba(234,223,196,0.08)',
                tickcolor: 'rgba(234,223,196,0.3)',
                linecolor: 'rgba(234,223,196,0.15)',
                tickfont: { color: 'rgba(234,223,196,0.6)' },
                rangemode: 'tozero',
                range: [0, 260],
            },
            legend: {
                font: { size: 17, color: '#EADFC4' },
                bgcolor: 'rgba(0,0,0,0)',
                orientation: 'h',
                x: 0.5,
                xanchor: 'center',
                y: 0.96,
                yanchor: 'bottom',
            },
            hovermode: 'x unified',
            hoverlabel: {
                bgcolor: '#3d0709',
                bordercolor: '#EADFC4',
                font: { family: '"Crimson Text", serif', color: '#EADFC4', size: 13 }
            },
            annotations: [
                getLegendHintAnnotation('#EADFC4', 1.13),
                {
                    x: '2016', y: 120,
                    text: 'Already unequal<br>STEM: 107 | ARTS: 26<br>(4x difference)',
                    showarrow: true,
                    arrowhead: 2,
                    arrowcolor: '#EADFC4',
                    ax: 20, ay: -80,
                    font: { family: '"Crimson Text", serif', size: 12, color: '#141310' },
                    bgcolor: '#EADFC4',
                    bordercolor: '#EADFC4',
                    borderwidth: 1,
                    borderpad: 6,
                },
                {
                    x: '2026', y: 10,
                    text: 'Elimination complete<br>STEM: 228 | ARTS: 4<br>(-85% since 2016)',
                    showarrow: true,
                    arrowhead: 2,
                    arrowcolor: '#D3B96D',
                    ax: -10, ay: -50,
                    font: { family: '"Crimson Text", serif', size: 12, color: '#141310' },
                    bgcolor: '#D3B96D',
                    bordercolor: '#D3B96D',
                    borderwidth: 1,
                    borderpad: 6,
                }
            ]
        };

        createLineRevealChart('chart-scu', scuTraces, scuLayout, {
            responsive: true,
            displayModeBar: false,
        }, {
            annotationReveal: "after",
        });

    });


    d3.csv("tuitionFee.csv").then(data => {
        const tuitionYears = data.map(r => +r.Year);
        const artsFees = data.map(r => +r.Arts);
        const eduFees = data.map(r => +r.Education);
        const engFees = data.map(r => +r.Engineering);
        const lawFees = data.map(r => +r.Law);

        const tTrace1 = {
            x: tuitionYears,
            y: artsFees,
            name: 'Arts',
            type: 'scatter',
            mode: 'lines',
            fill: 'tozeroy',
            line: { color: '#c55aaa96', width: 2, shape: 'spline' },
            fillcolor: 'rgba(74, 124, 111, 0.055)',
            hovertemplate: '<b>Arts</b><br>Year: %{x}<br>Fee: $%{y:,.0f}<extra></extra>'
        };

        const tTrace2 = {
            x: tuitionYears,
            y: eduFees,
            name: 'Education',
            type: 'scatter',
            mode: 'lines',
            fill: 'tozeroy',
            line: { color: '#4A7C6F', width: 2, shape: 'spline' },
            fillcolor: 'rgba(201, 168, 76, 0.075)',
            hovertemplate: '<b>Education</b><br>Year: %{x}<br>Fee: $%{y:,.0f}<extra></extra>'
        };

        const tTrace3 = {
            x: tuitionYears,
            y: engFees,
            name: 'Engineering',
            type: 'scatter',
            mode: 'lines',
            fill: 'tozeroy',
            line: { color: '#7c81e2', width: 2, shape: 'spline' },
            fillcolor: 'rgba(124, 129, 226, 0.055)',
            hovertemplate: '<b>Engineering</b><br>Year: %{x}<br>Fee: $%{y:,.0f}<extra></extra>'
        };

        const tTrace4 = {
            x: tuitionYears,
            y: lawFees,
            name: 'Law',
            type: 'scatter',
            mode: 'lines',
            fill: 'tozeroy',
            line: { color: '#8B5E6B', width: 2, shape: 'spline' },
            fillcolor: 'rgba(139, 94, 107, 0.04)',
            hovertemplate: '<b>Law</b><br>Year: %{x}<br>Fee: $%{y:,.0f}<extra></extra>'
        };

        const tuitionLayout = {
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: { family: '"Crimson Text", serif', color: '#141310', size: 12 },
            margin: { l: 60, r: 40, t: 76, b: 46 },
            hovermode: 'x unified',
            hoverlabel: {
                bgcolor: '#ffffff', bordercolor: '#d0c8b8',
                font: { family: '"Crimson Text", serif', color: '#141310', size: 13 }
            },
            xaxis: {
                showgrid: true, gridcolor: 'rgba(107,15,26,0.08)',
                zeroline: false, linecolor: 'rgba(107,15,26,0.2)',
                tickfont: { size: 11, color: '#141310' },
                dtick: 5, range: [1988, 2024]
            },
            yaxis: {
                showgrid: true, gridcolor: 'rgba(107,15,26,0.08)',
                zeroline: false, linecolor: 'rgba(107,15,26,0.2)',
                tickfont: { size: 11, color: '#141310' },
                tickformat: '$,.0f', range: [0, 21000]
            },
            legend: {
                orientation: 'h', xanchor: 'center', x: 0.5,
                yanchor: 'bottom', y: 1.05,
                font: { size: 14, color: '#141310' },
                bgcolor: 'rgba(0,0,0,0)'
            },
            shapes: [
                {
                    type: 'line', x0: 1989, y0: 0, x1: 1989, y1: 21000,
                    line: { color: 'rgba(107,15,26,0.25)', width: 2, dash: 'dash' }
                },
                {
                    type: 'line', x0: 1996, y0: 0, x1: 1996, y1: 21000,
                    line: { color: 'rgba(107,15,26,0.25)', width: 2, dash: 'dash' }
                },
                {
                    type: 'line', x0: 2020, y0: 0, x1: 2020, y1: 21000,
                    line: { color: 'rgba(107,15,26,0.25)', width: 2, dash: 'dash' }
                }
            ],
            annotations: [
                getLegendHintAnnotation('#6B5B54', 1.17),
                {
                    text: '<b>PHASE 1</b>', x: 1992.5, y: 19500,
                    showarrow: false, font: { size: 11, color: '#3d0709' },
                    bgcolor: 'rgba(234,223,196,0.9)', bordercolor: 'rgba(107,15,26,0.3)',
                    borderwidth: 1, borderpad: 4
                },
                {
                    text: '<b>PHASE 2</b>', x: 2008.5, y: 19500,
                    showarrow: false, font: { size: 11, color: '#3d0709' },
                    bgcolor: 'rgba(234,223,196,0.9)', bordercolor: 'rgba(107,15,26,0.3)',
                    borderwidth: 1, borderpad: 4
                },
                {
                    text: '<b>PHASE 3</b>', x: 2021.8, y: 19500,
                    showarrow: false, font: { size: 11, color: '#3d0709' },
                    bgcolor: 'rgba(234,223,196,0.9)', bordercolor: 'rgba(107,15,26,0.3)',
                    borderwidth: 1, borderpad: 4
                }
            ]
        };

        createLineRevealChart('tuitionChart', [tTrace4, tTrace3, tTrace2, tTrace1], tuitionLayout, {
            responsive: true,
            displayModeBar: false,
        }, {
            frameDelay: 45,
        });

    });

    //load the job market data from the CSV file and create the charts for STEM and ART graduates and job vacancies over time, with customized layouts, annotations, and hover interactions to highlight key trends and differences between the two fields, as well as calculating the ratio of vacancies to graduates to provide additional insights into the job market dynamics for STEM and ART fields
    d3.csv("job.csv").then(data => {
        const years = data.map(d => String(d.year).trim());
        const stemGrads = data.map(d => +d["STEM grad"].replace(/,/g, ''));
        const artGrads = data.map(d => +d["ART grad"].replace(/,/g, ''));
        const stemVac = data.map(d => +d["STEM job"]);
        const artVac = data.map(d => +d["ART job"]);
        const stemRatio = stemVac.map((v, i) => Math.round((v * 1000 / stemGrads[i]) * 100));
        const artRatio = artVac.map((v, i) => Math.round((v * 1000 / artGrads[i]) * 100));

        const axis = {
            showgrid: true,
            gridcolor: "rgba(107,15,26,0.08)",
            zeroline: false,
            linecolor: "rgba(107,15,26,0.2)",
            tickfont: { size: 12, color: "#141310" },
        };

        const xAxis = {
            ...axis,
            type: "category",
            tickmode: "array",
            tickvals: years,
            ticktext: years,
            range: [-0.6, years.length - 0.4],
        };

        const baseLayout = {
            autosize: true,
            plot_bgcolor: "rgba(0,0,0,0)",
            paper_bgcolor: "rgba(0,0,0,0)",
            font: { family: "Crimson Text, serif", color: "#6B5B54" },
            hovermode: "x unified",
            hoverlabel: {
                bgcolor: "#ffffff",
                bordercolor: "#d0c8b8",
                font: {
                    family: '"Crimson Text", serif',
                    color: "#141310",
                    size: 13,
                },
            },
            legend: {
                orientation: "h",
                x: 0.5,
                xanchor: "center",
                y: 1.02,
                yanchor: "bottom",
                font: { size: 15, color: "#6B5B54" },
                bgcolor: "rgba(0,0,0,0)",
            },
            annotations: [
                getLegendHintAnnotation('#6B5B54', 1.19),
            ],
            margin: { l: 48, r: 18, t: 78, b: 40 },
            bargap: 0.22,
            bargroupgap: 0.1,
        };

        const jobChartControls = {};

        const gradTraces = [
            {
                x: years,
                y: stemGrads,
                name: "STEMs",
                type: "bar",
                marker: { color: "#2d6b5e", line: { width: 0 } },
                hovertemplate: "<b>STEM graduates</b>: %{y:,}<extra></extra>",
            },
            {
                x: years,
                y: artGrads,
                name: "ARTs",
                type: "bar",
                marker: { color: "#6b0f1aaa", line: { width: 0 } },
                hovertemplate: "<b>Arts graduates</b>: %{y:,}<extra></extra>",
            },
        ];

        const gradLayout = {
            ...baseLayout,
            legend: {
                ...baseLayout.legend,
                font: { size: 15, color: "#6B5B54" },
            },
            annotations: [
                getLegendHintAnnotation('#6B5B54', 1.19),
            ],
            margin: { l: 48, r: 18, t: 78, b: 40 },
            xaxis: xAxis,
            yaxis: {
                ...axis,
                tickformat: ",d",
                range: [0, 42000],
                dtick: 10000,
            },
        };

        jobChartControls.gradChart = createBarRiseChart("gradChart", gradTraces, gradLayout, {
            responsive: true,
            displayModeBar: false,
        });

        const vacTraces = [
            {
                x: years,
                y: stemVac,
                name: "STEM industries",
                type: "bar",
                marker: { color: "#2d6b5e", line: { width: 0 } },
                hovertemplate: "<b>STEM vacancies</b>: %{y}<extra></extra>",
            },
            {
                x: years,
                y: artVac,
                name: "Arts industries",
                type: "bar",
                marker: { color: "#6b0f1aaa", line: { width: 0 } },
                hovertemplate: "<b>Arts vacancies</b>: %{y}<extra></extra>",
            },
        ];

        const vacLayout = {
            ...baseLayout,
            xaxis: xAxis,
            yaxis: {
                ...axis,
                ticksuffix: "k",
                range: [0, 50],
                dtick: 10,
            },
        };

        jobChartControls.vacChart = createBarRiseChart("vacChart", vacTraces, vacLayout, {
            responsive: true,
            displayModeBar: false,
        });

        const ratioTraces = [
            {
                x: years,
                y: stemRatio,
                name: "STEMs",
                type: "scatter",
                mode: "lines+markers",
                line: { color: "#2d6b5e", width: 3 },
                marker: { size: 8, color: "#2d6b5e" },
                fill: "tozeroy",
                fillcolor: "rgba(45,107,94,0.12)",
                hovertemplate: "<b>STEM</b>: %{y} slots per 100 grads<extra></extra>",
            },
            {
                x: years,
                y: artRatio,
                name: "ARTs",
                type: "scatter",
                mode: "lines+markers",
                line: { color: "#6b0f1aaa", width: 3, dash: "dash" },
                marker: { size: 8, color: "#6b0f1aaa" },
                fill: "tozeroy",
                fillcolor: "rgba(139,94,107,0.10)",
                hovertemplate: "<b>Arts</b>: %{y} slots per 100 grads<extra></extra>",
            },
        ];

        const ratioLayout = {
            ...baseLayout,
            xaxis: xAxis,
            yaxis: {
                ...axis,
                range: [0, 230],
                dtick: 50,
            },
        };

        // create the ratio chart with a line reveal animation and store the controls for later use when resizing or switching tabs
        jobChartControls.ratioChart = createLineRevealChart("ratioChart", ratioTraces, ratioLayout, {
            responsive: true,
            displayModeBar: false,
        }, {
            frameDelay: 95,
        });

        // set up the tab buttons to switch between the graduates, vacancies, and ratio charts, ensuring that the correct chart is displayed when a tab is clicked and that the charts are resized and animated properly when switching tabs for an optimal user experience
        document.querySelectorAll(".job-tab").forEach(btn => {
            btn.addEventListener("click", () => {
                document.querySelectorAll(".job-tab").forEach(b => b.classList.remove("job-tab--active"));
                document.querySelectorAll(".job-tab-panel").forEach(p => p.style.display = "none");

                btn.classList.add("job-tab--active");

                const panel = document.getElementById("tab-" + btn.dataset.tab);
                panel.style.display = "flex";

                const chartId = btn.dataset.tab === "vacancies" ? "vacChart" : "ratioChart";

                requestAnimationFrame(() => {
                    const chartElement = document.getElementById(chartId);
                    Plotly.Plots.resize(chartElement);
                    jobChartControls[chartId]?.resetChart();
                    requestAnimationFrame(() => {
                        jobChartControls[chartId]?.animateChart();
                    });
                });
            });
        });
    });

    // Chart 3 - Global Arts Course Cuts
    d3.csv("axesCourse.csv").then(data => {

        const cuts = data.map(r => +r["Arts course cut down"]);
        const names = data.map(r => (r["University Name"] || r["Univeristy Name"] || '').trim());
        const maxCut = d3.max(cuts) || 0;
        const tickStep = maxCut ? Math.ceil((maxCut / 4) / 5) * 5 : 1;
        const universityCount = names.filter(Boolean).length;
        const coursesTotal = d3.sum(cuts);
        const mapUniversityCount = document.getElementById("mapUniversityCount");
        const mapCoursesTotal = document.getElementById("mapCoursesTotal");
        const mapSummaryRow = document.querySelector(".map-summary-row");

        setupScrambleCounterOnView(mapSummaryRow, [
            { element: mapUniversityCount, value: universityCount },
            { element: mapCoursesTotal, value: coursesTotal },
        ]);

        const trace = {
            type: 'scattergeo',
            lat: data.map(r => +r.lat),
            lon: data.map(r => +r.lon),
            mode: 'markers',
            marker: {
                size: 10,
                opacity: 0.95,
                color: cuts,
                colorscale: [
                    [0, '#FFD447'],
                    [0.35, '#FF9A2E'],
                    [0.7, '#FF4F5E'],
                    [1, '#FFF3E0'],
                ],
                cmin: 0,
                cmax: maxCut,
                showscale: true,
                colorbar: {
                    title: {
                        text: 'courses cut',
                        font: { family: '"Crimson Text", serif', color: '#EADFC4', size: 12 },
                        side: 'right',
                    },
                    tickfont: { family: '"Crimson Text", serif', color: 'rgba(234,223,196,0.8)', size: 11 },
                    outlinecolor: 'rgba(234,223,196,0.2)',
                    outlinewidth: 0.5,
                    bgcolor: 'rgba(0,0,0,0)',
                    len: 0.5,
                    thickness: 10,
                    x: 1.02,
                    tickvals: [0, tickStep, tickStep * 2, tickStep * 3, maxCut],
                },
                line: { width: 1.2, color: 'rgba(255,244,214,0.95)' },
            },
            customdata: names.map((n, i) => [n, cuts[i]]),
            hovertemplate:
                '<b>%{customdata[0]}</b><br>' +
                'Arts courses cut: <b>%{customdata[1]}</b>' +
                '<extra></extra>',
            hoverlabel: {
                bgcolor: '#3d0709',
                bordercolor: '#EADFC4',
                font: { family: '"Crimson Text", serif', color: '#EADFC4', size: 13 },
            },
        };

        const layout = {
            paper_bgcolor: '#2a0608',
            height: 480,
            margin: { t: 112, b: 10, l: 0, r: 80 },
            font: { family: '"Crimson Text", serif', color: '#EADFC4' },
            title: {
                text: 'Arts Course Cuts at Universities Around the World',
                font: { family: '"Crimson Text", serif', color: '#EADFC4', size: 22 },
                x: 0.46,
                xanchor: 'center',
                pad: { b: 46 },
            },
            annotations: [
                getMapHintAnnotation(),
            ],
            geo: {
                projection: {
                    type: 'natural earth',
                    rotation: { lon: 20, lat: 10, roll: 0 },
                    scale: 0.78,
                },
                bgcolor: '#2a0608',
                showland: true, landcolor: '#A75F62',
                showocean: true, oceancolor: '#3F1119',
                showcountries: true, countrycolor: 'rgba(234,223,196,0.32)',
                showcoastlines: true, coastlinecolor: 'rgba(234,223,196,0.42)',
                showlakes: true, lakecolor: '#3F1119',
                showframe: true, framecolor: 'rgba(234,223,196,0.22)',
                showgraticule: true,
                graticule: { color: 'rgba(234,223,196,0.12)', width: 0.5 },
            },
        };

        Plotly.newPlot('mapChart', [trace], layout, {
            responsive: true,
            displayModeBar: true,
            scrollZoom: true,
        });
    });

    // Chart 8 - State Decline in Arts Enrolments
    //code base by codex
    const stateDeclineRows = document.getElementById("stateDeclineRows");
// utility functions to process and format the state decline data, create SVG icons representing people, and render a custom chart showing the decline in arts enrolments across different states, with visual representations of the remaining proportion of enrolments using partially filled icons and percentage change annotations to highlight the severity of the decline in each state
    const stateDeclineToNumber = (value) => Number(
        String(value)
            .replace(/−/g, "-")
            .replace(/,/g, "")
            .replace(/%/g, "")
            .trim()
    );
// function to format numbers with commas for thousands separators, ensuring that the values are displayed in a more readable format in the chart annotations and meta information
    const formatStateDeclineNumber = (value) => Number(value).toLocaleString("en-AU");
// function to format the percentage change values with a plus or minus sign and round them to the nearest whole number, making it easier for users to quickly grasp the extent of the decline in arts enrolments for each state
    const formatStateDeclinePercent = (value) => {
        const rounded = Math.round(value);
        return `${rounded < 0 ? "−" : "+"}${Math.abs(rounded)}%`; // use a proper minus sign for negative values and ensure that the percentage is displayed with a clear indication of increase or decrease, enhancing the clarity of the information presented in the chart annotations and meta descriptions
    };

// function to clamp the fill fraction value between 0 and 1, ensuring that the visual representation of the remaining enrolments does not exceed the bounds of the icon and accurately reflects the proportion of enrolments remaining in each state
    const clampStateDeclineValue = (value, min, max) => Math.max(min, Math.min(max, value)); // this function ensures that the fill fraction used for the person icons in the state decline chart is always between 0 and 1, preventing any visual overflow or underflow in the representation of the remaining enrolments and maintaining the integrity of the chart's visual design

    const getStateDeclinePersonSvg = () => `
        <svg class="state-decline-person-svg" xmlns="http://www.w3.org/2000/svg" viewBox="120 24 400 592" aria-hidden="true">
            <path fill="currentColor" d="M376 88C376 57.1 350.9 32 320 32C289.1 32 264 57.1 264 88C264 118.9 289.1 144 320 144C350.9 144 376 118.9 376 88zM400 300.7L446.3 363.1C456.8 377.3 476.9 380.3 491.1 369.7C505.3 359.1 508.3 339.1 497.7 324.9L427.2 229.9C402 196 362.3 176 320 176C277.7 176 238 196 212.8 229.9L142.3 324.9C131.8 339.1 134.7 359.1 148.9 369.7C163.1 380.3 183.1 377.3 193.7 363.1L240 300.7L240 576C240 593.7 254.3 608 272 608C289.7 608 304 593.7 304 576L304 416C304 407.2 311.2 400 320 400C328.8 400 336 407.2 336 416L336 576C336 593.7 350.3 608 368 608C385.7 608 400 593.7 400 576L400 300.7z"></path>
        </svg> 
    `;//using w3 css style for the person icon, this function returns an SVG representation of a person that can be used in the state decline chart to visually represent the remaining enrolments in each state, allowing for a more engaging and intuitive way to understand the data by showing a partially filled icon based on the proportion of enrolments left, enhancing the overall visual impact of the chart and making it easier for users to grasp the severity of the decline in arts enrolments across different states
// function to create a DOM element representing a person icon with a partially filled portion based on the fill fraction, allowing for a visual representation of the remaining enrolments in each state by filling the icon proportionally to the percentage of enrolments left   
    const createStateDeclinePerson = (fillFraction) => {
        const wrap = document.createElement("span");
        const clippedWidth = clampStateDeclineValue(fillFraction, 0, 1) * 100;
// set the class name for styling and create the inner HTML structure with a base icon and a clipped portion that visually represents the remaining enrolments based on the fill fraction, using the same SVG for both parts to ensure consistency in appearance while allowing for the visual effect of partial filling
        wrap.className = "state-decline-person";
        wrap.innerHTML = `
            <span class="state-decline-person-base">${getStateDeclinePersonSvg()}</span>
            <span class="state-decline-person-clip" style="width: ${clippedWidth}%">${getStateDeclinePersonSvg()}</span>
        `;

        return wrap;
    };
// function to create a row of person icons representing the remaining enrolments for a state, where the number of filled icons corresponds to the remaining ratio of enrolments, providing a quick visual comparison of the decline across different states in the chart
    const createStateDeclineIconRow = (remainingRatio) => {
        const icons = document.createElement("div");
        const totalIcons = 20;
        const remainingIcons = Math.round(clampStateDeclineValue(remainingRatio, 0, 1) * totalIcons);
// set the class name for styling and append the appropriate number of filled and unfilled person icons based on the remaining ratio, creating a visual representation of the proportion of enrolments left in each state that can be easily compared across the chart, enhancing the user's ability to quickly understand the severity of the decline in arts enrolments for each state
        icons.className = "state-decline-icons";

        for (let i = 0; i < totalIcons; i++) { // append a person icon with the fill fraction set to 1 for the remaining icons and 0 for the declined icons, visually representing the proportion of enrolments left in each state in a way that is easy to interpret at a glance, allowing users to quickly grasp the extent of the decline in arts enrolments across different states in the chart
            icons.appendChild(createStateDeclinePerson(i < remainingIcons ? 1 : 0)); // this line creates a person icon with a fill fraction of 1 (fully filled) for the number of remaining icons and 0 (unfilled) for the rest, effectively visualizing the percentage of enrolments left in each state through the number of filled icons in the row, making it easier for users to compare the decline across states and understand the severity of the decline in arts enrolments in a visually engaging way
        }

        return icons;
    };
// function to render the state decline chart by processing the CSV data, calculating the percentage change and remaining ratio for each state, and creating DOM elements to display the state name, meta information about the enrolment numbers, percentage change, and a visual representation of the remaining enrolments using person icons, allowing users to easily compare the decline across different states and understand the severity of the decline in arts enrolments in a visually engaging way
    const renderStateDeclineChart = (rows) => {
        const data = rows
            .map(row => {
                const startTotal = stateDeclineToNumber(row["2018 total"]); // convert the 2018 total enrolments to a number for calculations, ensuring that the data is in the correct format for computing the percentage change and remaining ratio, which are essential for accurately representing the decline in arts enrolments across different states in the chart
                const endTotal = stateDeclineToNumber(row["2023 total"]); // convert the 2023 total enrolments to a number for calculations, allowing for the computation of the percentage change and remaining ratio that will be used to visually represent the decline in arts enrolments across different states in the chart, providing insights into the severity of the decline for each state
                const percentChange = row["% Change"] 
                    ? stateDeclineToNumber(row["% Change"])
                    : ((endTotal - startTotal) / startTotal) * 100; // calculate the percentage change in enrolments from 2018 to 2023, using the provided % Change value if available or computing it based on the start and end totals, which is crucial for understanding the extent of the decline in arts enrolments for each state and will be displayed in the chart annotations to highlight the severity of the decline across different states

                return {
                    state: row.State,
                    startTotal,
                    endTotal,
                    percentChange,
                    remainingRatio: startTotal > 0 ? endTotal / startTotal : 0, // calculate the remaining ratio of enrolments for visual representation, ensuring that it is a valid proportion that can be used to determine how many person icons to fill in the chart, providing a clear visual indication of the proportion of enrolments left in each state after the decline, which is essential for users to quickly grasp the severity of the decline in arts enrolments across different states in the chart
                };
            })
            .sort((a, b) => a.percentChange - b.percentChange); // sort the data by percentage change in ascending order to display the states with the most severe decline at the top of the chart, allowing users to easily identify which states have experienced the greatest reduction in arts enrolments and understand the overall trend of decline across different states in a visually engaging way

        stateDeclineRows.replaceChildren();
// iterate through the processed data and create DOM elements for each state to display the state name, meta information about the enrolment numbers, percentage change, and a visual representation of the remaining enrolments using person icons, allowing users to easily compare the decline across different states and understand the severity of the decline in arts enrolments in a visually engaging way
        data.forEach(item => {
            const row = document.createElement("article");
            const left = document.createElement("div");
            const stateName = document.createElement("h2");
            const meta = document.createElement("p");
            const percent = document.createElement("p");

            row.className = "state-decline-row";
            stateName.className = "state-decline-name";
            meta.className = "state-decline-meta";
            percent.className = "state-decline-percent";

            stateName.textContent = item.state;
            meta.textContent = `${formatStateDeclineNumber(item.startTotal)} in 2018 → ${formatStateDeclineNumber(item.endTotal)} in 2023`;
            percent.textContent = formatStateDeclinePercent(item.percentChange);

            left.appendChild(stateName);
            left.appendChild(createStateDeclineIconRow(item.remainingRatio));
            left.appendChild(meta);
            row.appendChild(left);
            row.appendChild(percent);
            stateDeclineRows.appendChild(row);
        });
    };

    if (stateDeclineRows) d3.csv("consequences.csv").then(renderStateDeclineChart); // load the state decline data from the CSV file and render the chart using the processed data, allowing users to visualize the decline in arts enrolments across different states with clear annotations and visual representations of the remaining enrolments, providing insights into the severity of the decline for each state in an engaging and informative way

});

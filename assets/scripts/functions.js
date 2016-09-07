"use strict";

// ! Dependency graph

function Chapter(name)
{
    this.name = name;
    this.requiredChapters = [];
}

var chapters = {};

function addChapter(name, requiredChapters)
{
    var chapter = new Chapter(name);
    chapter.requiredChapters = requiredChapters;
    chapters[name] = chapter;
}

addChapter("kineticEnergy", []);
addChapter("potentialEnergy", [chapters.kineticEnergy]);
addChapter("heat", [chapters.kineticEnergy]);
addChapter("phasesOfMatter", [chapters.potentialEnergy, chapters.heat]);
addChapter("evaporation", [chapters.phasesOfMatter]);


function availableChapters(finishedChapters)
{
    var available = [];
    for (var chapterKey in chapters)
    {
        var chapter = chapters[chapterKey];
        var isChapterAvailable = true;
        for (var requiredChapter of chapter.requiredChapters)
        {
            var isRequiredChapterFinished = false
            for (var finishedChapter of finishedChapters)
            {
                if (requiredChapter === finishedChapter)
                {
                    isRequiredChapterFinished = true;
                    break;
                }
            }
            if (!isRequiredChapterFinished)
            {
                isChapterAvailable = false;
                break;
            }
        }
        if (isChapterAvailable)
        {
            available.push(chapter);
        }
    }
    return available;
}

// ! Pool

function Pool(constructor)
{
    this.constructor = constructor;

    this.freeList = [];
}

function poolAlloc(pool)
{
    var object;
    if (pool.freeList.length == 0)
    {
        object = new pool.constructor();
    }
    else
    {
        object = pool.freeList.pop();
    }
    return object;
}

function poolFree(pool, object)
{
    pool.freeList.push(object);
}

// ! Vectors


var v2 = function(x, y)
{
    var out = new Float32Array(2);
    out[0] = x;
    out[1] = y;
    return out;
};

v2.pool = new Pool(function()
{
    return new Float32Array(2);
});

v2.alloc = function()
{
    return poolAlloc(v2.pool);
};

v2.free = function(a)
{
    poolFree(v2.pool, a);
};


v2.clone = function(a)
{
    var out = new Float32Array(2);
    out[0] = a[0];
    out[1] = a[1];
    return out;
};

v2.set = function(out, x, y)
{
    out[0] = x;
    out[1] = y;
    return out;
};

v2.copy = function(out, a)
{
    out[0] = a[0];
    out[1] = a[1];
    return out;
};

v2.add = function(out, a, b)
{
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    return out;
};

v2.subtract = function(out, a, b)
{
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    return out;
};

v2.negate = function(out, a)
{
    out[0] = -a[0];
    out[1] = -a[1];
    return out;
};

v2.scale = function(out, a, t)
{
    out[0] = t * a[0];
    out[1] = t * a[1];
    return out;
};

v2.scaleAndAdd = function(out, a, b, t)
{
    out[0] = a[0] + b[0] * t;
    out[1] = a[1] + b[1] * t;
    return out;
};

v2.inner = function(a, b)
{
    return a[0] * b[0] + a[1] * b[1];
};

v2.setPolar = function(out, radius, angle)
{
    var x = radius * Math.cos(angle);
    var y = radius * Math.sin(angle);
    return v2.set(out, x, y);
};

v2.square = function(a)
{
    return a[0] * a[0] + a[1] * a[1];
};

v2.magnitude = function(a)
{
    return Math.sqrt(v2.square(a));
};

v2.isZero = function(a)
{
    return (a[0] == 0) && (a[1] == 0);
}

v2.isFinite = function(a)
{
    return (isFinite(a[0]) && isFinite(a[1]));
}

v2.isAlmostZero = function(a)
{
    var tolerance = 0.000001;
    return (v2.square(a) < tolerance);
}

v2.normalize = function(out, a)
{
    var length = v2.magnitude(a);
    v2.scale(out, a, 1 / length);
    return out;
};

v2.projectOntoNormal = function(out, a, normal)
{
    var length = v2.inner(a, normal);
    v2.scale(out, normal, length);
    return out;
};

v2.perpCCW = function(out, a)
{
    var x = a[0];
    var y = a[1];
    out[0] = -y;
    out[1] = x;
    return out;
};

v2.perpCW = function(out, a)
{
    var x = a[0];
    var y = a[1];
    out[0] = y;
    out[1] = -x;
    return out;
};

v2.outer = function(a, b)
{
    return a[0] * b[1] - a[1] * b[0];
};

// TODO: make sure inside rect (right now only cares about width and height)
v2.periodicize = function(out, a, bounds)
{
    out[0] = a[0] - bounds.width * Math.floor(a[0] / bounds.width + 0.5);
    out[1] = a[1] - bounds.height * Math.floor(a[1] / bounds.height + 0.5);
    return out;
};

v2.squaredDistance = function(a, b)
{
    var dx = a[0] - b[0];
    var dy = a[1] - b[1];
    return (dx * dx + dy * dy);
}

v2.distance = function(a, b)
{
    return Math.sqrt(v2.squaredDistance(a, b));
}

// ! Generally useful

function combineWithDefaults(opts, defaults)
{
    for (var key in defaults)
    {
        if (!opts.hasOwnProperty(key))
        {
            opts[key] = defaults[key];
        }
        else if (typeof opts[key] === 'object')
        {
            combineWithDefaults(opts[key], defaults[key]);
        }
    }
}

function copyObject(destination, source)
{
    for (var key in source)
    {
        if (typeof destination[key] === 'object')
        {
            copyObject(destination[key], source[key]);
        }
        else
        {
            destination[key] = source[key];
        }
    }
}

function arrayRemoveElementAt(array, index)
{
    array.splice(index, 1);
}

function arrayLast(array)
{
    return array[array.length - 1];
}

function arrayRandomElement(array)
{
    var randomIndex = randomInt(array.length);
    return array[randomIndex];
}

function arrayContains(array, element)
{
    for (var i = 0; i < array.length; i++)
    {
        if (array[i] === element)
        {
            return true;
        }
    }
    return false;
}

function arrayMinIndex(array, f)
{
    var minimum = Number.MAX_VALUE;
    var minimumIndex = -1;
    for (var i = 0; i < array.length; i++)
    {
        var value = f(array[i]);
        if (value < minimum)
        {
            minimum = value;
            minimumIndex = i;
        }
    }
    return minimumIndex;
}

function arrayMin(array, f)
{
    var minIndex = arrayMinIndex(array, f);
    return f(array[minIndex]);
}

function numericCompare(a, b)
{
    return (a - b);
}

function arraySort(array)
{
    array.sort(numericCompare);
}

// ! DOM stuff

function createAndAppend(elementType, parent)
{
    var element = document.createElement(elementType);
    parent.appendChild(element);
    return element;
}

function createAndPrepend(elementType, parent)
{
    var element = document.createElement(elementType);
    parent.insertBefore(element, parent.firstChild);
    return element;
}

function createElement(type)
{
    return document.createElement(type);
}

function createElementHere(type)
{
    return insertHere(createElement(type));
}

function insertHere(element)
{

    document.currentScript.parentNode.insertBefore(element, document.currentScript);
    return element
}

function setElementIsVisible(element, isVisible)
{
    setElementClass(element, "hidden", !isVisible);
}

function setElementClass(element, className, isEnabled)
{
    if (isEnabled)
    {
        element.classList.add(className);
    }
    else
    {
        element.classList.remove(className);
    }
}

function setElementEnabled(element, isEnabled) {
    setElementClass(element, "disabled", !isEnabled);
    element.disabled = !isEnabled;
}


function css(number, unit)
{
    unit = unit || "px";
    return String(number) + unit;
}

// ! Controls

function createSliderHere(opts)
{
    insertHere(createSlider(opts));
}

function identity(x)
{
    return x;
}

function createSlider(opts)
{
    combineWithDefaults(opts,
    {
        transform: identity,
        inverseTransform: identity,
        minLabel: String(opts.min),
        maxLabel: String(opts.max),
        isSnapBack: false,
        isExternallyChangeable: false,
    });

    var initialSliderValue = opts.inverseTransform(opts.object[opts.name]);
    var sliderMin = opts.inverseTransform(opts.min);
    var sliderMax = opts.inverseTransform(opts.max);
    var step = opts.step || (sliderMax - sliderMin) / 1000;

    // set up elements

    var p = createElement("p");
    p.appendChild(document.createTextNode(opts.minLabel));
    var slider = createAndAppend("input", p);
    p.appendChild(document.createTextNode(opts.maxLabel));

    // configure slider

    slider.setAttribute("type", "range");
    slider.setAttribute("value", initialSliderValue);
    slider.setAttribute("min", sliderMin);
    slider.setAttribute("max", sliderMax);
    slider.setAttribute("step", step);

    // set up callbacks

    slider.addEventListener("input", function()
    {
        opts.object[opts.name] = opts.transform(Number(slider.value));
    });

    if (opts.isSnapBack)
    {
        slider.addEventListener("change", function()
        {
            slider.value = initialSliderValue;
            opts.object[opts.name] = opts.transform(Number(initialSliderValue));
        });
    }

    var updater;

    if (opts.isExternallyChangeable)
    {
        updater = function()
        {
            slider.value = opts.inverseTransform(opts.object[opts.name]);
            window.requestAnimationFrame(updater);
        }
    }
    else
    {
        updater = function()
        {
            opts.object[opts.name] = opts.transform(Number(slider.value));
            window.requestAnimationFrame(updater);
        }
    }

    updater();
    
    return p;
}


function createCheckbox(opts)
{
    var label = createElement("label");
    var checkbox = createAndAppend("input", label);
    checkbox.setAttribute("type", "checkbox");
    checkbox.checked = opts.object[opts.name];
    label.insertAdjacentHTML("beforeEnd", opts.label);

    checkbox.addEventListener("change", function()
    {
        opts.object[opts.name] = this.checked;
    });

    var updater = function()
    {
        checkbox.checked = opts.object[opts.name];
        window.requestAnimationFrame(updater);
    }

    updater();

    return label;
}

function createButton(opts)
{   
    var div = createElement("div");
    var button = createAndAppend("input", div);
    button.setAttribute("type", "button");
    button.setAttribute("value", opts.label);
    button.addEventListener("click", opts.action);
    return div;
}

function createOutput(update)
{
    var p = createElement("p");
    var output = createAndAppend("output", p);

    var updater = function()
    {
        var value = update();
        if (isNumber(value))
        {
            output.value = value.toFixed(2);
        }
        else
        {
            output.value = value;
        }
        
        window.requestAnimationFrame(updater);
    }

    updater();

    return p;
}

// TODO: progress bar

// ! Interactive Slides

// TODO: rename these to stepEnd, stepTask/stepCondition, stepSetup

function cue(cueCondition)
{
    var cue = new Cue();
    cue.condition = cueCondition;
    cue.element = document.currentScript.previousElementSibling;
    setCompleted(cue, false);
    addAction(cue);
}

function endStep()
{
    var stepEnd = new StepEnd();
    addAction(stepEnd);
}

function setup(setupFunction)
{
    var setup = new Setup();
    setup.function = setupFunction;
    addAction(setup);
}

function addAction(action)
{
    var script = document.currentScript;
    script.actions = script.actions || [];
    script.actions.push(action);
}

var StepEnd = function() {};

var Setup = function()
{
    this.function = null;
}

var Step = function()
{
    this.elements = [];
    this.cues = [];
    this.setup = null;
    this.isListeningForCue = false;
    this.isCompleted = false;
}

var Cue = function()
{
    this.condition = null;
    this.isCompleted = false;
    this.element = null;
}

function setCompleted(cue, isCompleted)
{
    cue.isCompleted = isCompleted;
    if (isCompleted)
    {
        cue.element.classList.remove("incomplete");
        cue.element.classList.add("complete");
    }
    else
    {
        cue.element.classList.add("incomplete");
        cue.element.classList.remove("complete");
    }
}

function initStepLog(stepLogElement)
{
    var stepLog = {};
    stepLog.div = stepLogElement;
    stepLog.currentStepIndex = 0;
    stepLog.steps = [];
    stepLog.isCompleted = false;

    var step = new Step();
    stepLog.steps.push(step);
    for (var childIndex = 0; childIndex < stepLogElement.children.length; childIndex++)
    {
        var stepLogChild = stepLogElement.children[childIndex];
        var isScriptNode = false;
        if (stepLogChild.actions)
        {
            for (var action of stepLogChild.actions)
            {
                if (action instanceof Setup)
                {
                    step.setup = action.function;
                }
                else if (action instanceof Cue)
                {
                    step.cues.push(action);
                }
                else if (action instanceof StepEnd)
                {
                    step = new Step();
                    stepLog.steps.push(step);
                }
            }
        }
        else
        {
            step.elements.push(stepLogChild);
        }
    }
    var firstStep = stepLog.steps[0];
    firstStep.isListeningForCue = true;
    for (var elementIndex = 0; elementIndex < firstStep.elements.length; elementIndex++)
    {
        var element = firstStep.elements[elementIndex];
        element.style.opacity = 1;
    }

    var timeUntilListening = 0;

    stepLog.update = function(dtInSeconds)
    {
        var currentStep = stepLog.steps[stepLog.currentStepIndex];

        if (timeUntilListening > 0)
        {
            timeUntilListening -= dtInSeconds;
            return;
        }

        var areAllCuesCompleted = true;
        for (var cue of currentStep.cues)
        {
            if (cue.isCompleted)
            {
                continue;
            }
            else if (cue.condition(dtInSeconds))
            {
                setCompleted(cue, true);
                solvedSound.play();

                timeUntilListening = 1; // seconds
            }
            else
            {
                areAllCuesCompleted = false;
            }
        }

        if (areAllCuesCompleted)
        {
            changeStep(stepLog, stepLog.currentStepIndex + 1);
        }
    }

    return stepLog;
}

function changeStep(stepLog, stepIndex)
{
    var isValidIndex = (0 <= stepIndex) && (stepIndex < stepLog.steps.length);
    if (!isValidIndex)
    {
        return;
    }
    while (stepLog.currentStepIndex < stepIndex)
    {
        var currentStep = stepLog.steps[stepLog.currentStepIndex];
        for (var cue of currentStep.cues)
        {
            setCompleted(cue, true);
        }
        currentStep.isCompleted = true;


        stepLog.currentStepIndex += 1;
        var nextStep = stepLog.steps[stepLog.currentStepIndex];
        for (var element of nextStep.elements)
        {
            setElementIsVisible(element, true)
            element.style.opacity = 1;
        }
    }

    while (stepLog.currentStepIndex > stepIndex)
    {
        var currentStep = stepLog.steps[stepLog.currentStepIndex];
        for (var element of currentStep.elements)
        {
            element.style.opacity = 0;
            setElementIsVisible(element, false);
        }
        for (var cue of currentStep.cues)
        {
            setCompleted(cue, false);
        }
        currentStep.isCompleted = false;
        stepLog.currentStepIndex -= 1;


    }

    var currentStep = stepLog.steps[stepLog.currentStepIndex];
    for (var element of currentStep.elements)
    {
        setElementIsVisible(element, true);
        element.style.opacity = 1;
    }

    stepLog.isCompleted = stepIndex == (stepLog.steps.length - 1);
    if (stepLog.isCompleted)
    {
        stepLog.div.classList.add("isCompleted");
    }
}

var PageStatus = createEnum(["past", "present", "future"]);

function setPageStatus(page, status)
{
    if (status === PageStatus.past)
    {
        setElementIsVisible(page.div, false);
    }
    else if (status === PageStatus.present)
    {
        setElementIsVisible(page.div, true);
    }
    else if (status === PageStatus.future)
    {
        setElementIsVisible(page.div, false);
    }
}

function changePage(chapter, pageIndex, doesChangeStepLogs)
{
    var isValidIndex = (0 <= pageIndex) && (pageIndex < chapter.pages.length);
    if (!isValidIndex)
    {
        return;
    }

    while (chapter.currentPageIndex < pageIndex)
    {
        var currentPage = chapter.pages[chapter.currentPageIndex];
        if (doesChangeStepLogs)
        {
            changeStep(currentPage.stepLog, currentPage.stepLog.steps.length - 1);
        }
        setPageStatus(currentPage, PageStatus.past);

        chapter.currentPageIndex += 1;
    }

    while (chapter.currentPageIndex > pageIndex)
    {
        var currentPage = chapter.pages[chapter.currentPageIndex];
        if (doesChangeStepLogs)
        {
            changeStep(currentPage.stepLog, 0);        
        }
        
        setPageStatus(currentPage, PageStatus.future);

        chapter.currentPageIndex -= 1;
    }

    var currentPage = chapter.pages[chapter.currentPageIndex];
    setPageStatus(currentPage, PageStatus.present);
    var isLastPage = (chapter.currentPageIndex === (chapter.pages.count - 1));
    setElementEnabled(chapter.nextButton, currentPage.stepLog.isCompleted && (!isLastPage));

    setElementEnabled(chapter.previousButton, chapter.currentPageIndex > 0);
}

function initChapter()
{
    var chapter = {
        div: null,
        pages: [],
        currentPageIndex: 0,
    }

    chapter.div = document.getElementById("chapter");
    if (chapter.div === null)
    {
        return null;
    }

    // Add and init pages and their stepLogs

    for (var chapterChildIndex = 0; chapterChildIndex < chapter.div.children.length; chapterChildIndex++)
    {
        var childElement = chapter.div.children[chapterChildIndex];
        if (!childElement.classList.contains("page"))
        {
            continue;
        }
        var page = {
            div: childElement,
        }
        setElementIsVisible(page.div, false);

        chapter.pages.push(page);
        for (var pageChildIndex = 0; pageChildIndex < page.div.children.length; pageChildIndex++)
        {
            var child = page.div.children[pageChildIndex];
            if (child.classList.contains("stepLog"))
            {
                page.stepLog = initStepLog(child);
                break;
            }
        }
    }

    // Previous and next buttons


    var navigationDiv = createAndPrepend("div", chapter.div);
    navigationDiv.classList.add("navigationBar");

    chapter.previousButton = createButton({
        label: "← Previous",
        action: function() {
           changePage(chapter, chapter.currentPageIndex - 1);
        }
    });
    chapter.previousButton.classList.add("navigationButton");
    navigationDiv.appendChild(chapter.previousButton);

    chapter.nextButton = createButton({
        label: "Next →",
        action: function() {
            changePage(chapter, chapter.currentPageIndex + 1);
        },
    });
    chapter.nextButton.classList.add("navigationButton");
    navigationDiv.appendChild(chapter.nextButton);

    if (chapter.pages.length < 2)
    {
        setElementIsVisible(navigationDiv, false);
    }

    // TODO: update the hash as we advance through the chapter
    var updateFromHash = function()
    {
        var hash = window.location.hash.slice(1);
        var pageIndex = 0;
        var stepIndex = 0;
        if (hash)
        {
            var indices = hash.split("-");
            if (indices.length == 1)
            {
                stepIndex = Number(indices[0]);
            }
            else if (indices.length >= 2)
            {
                pageIndex = Number(indices[0]);
                stepIndex = Number(indices[1]);
            }
        }

        changePage(chapter, pageIndex);
        var currentPage = chapter.pages[chapter.currentPageIndex];
        changeStep(currentPage.stepLog, stepIndex);
    }

    window.addEventListener("hashchange", updateFromHash);

    updateFromHash();

    chapter.updater = function()
    {
        var newTimestamp = performance.now();
        var dtInSeconds = (newTimestamp - chapter.timestamp) / 1000;
        chapter.timestamp = newTimestamp;

        var currentPage = chapter.pages[chapter.currentPageIndex];
        currentPage.stepLog.update(dtInSeconds);
        var isLastPage = (chapter.currentPageIndex >= (chapter.pages.length - 1))
        if (!isLastPage) {
            setElementEnabled(chapter.nextButton, currentPage.stepLog.isCompleted);
        }
        window.requestAnimationFrame(chapter.updater);
    }

    chapter.timestamp = performance.now();
    chapter.updater();

    return chapter;
}

// NOTE: initChapter is always run on every document!
document.addEventListener("DOMContentLoaded", initChapter);

// ! Cue functions

function waitCue(timeLeft) {
    var cueFunction = function(dt)
    {
        timeLeft -= dt;
        return (timeLeft <= 0);
    }
    return cueFunction;
}

function minimumEnergyCue(simulation, minEnergy) {
    var cueFunction = function()
    {
        return (getTotalEnergy(simulation) > minEnergy);
    }
    return cueFunction;
}

// ! Toolbar

function createToolbar()
{
    var toolbar = {
        div: createElement("div"),
        selectElement: null,
        tools:
        {},
        selectedToolName: "",
    };
    toolbar.div.classList.add("toolbar");
    var label = createAndAppend("label", toolbar.div);
    label.innerHTML = "Tool:"
    toolbar.selectElement = createAndAppend("select", label);

    toolbar.selectElement.addEventListener("input", function(event)
    {
        var newToolName = event.srcElement.value;
        selectTool(toolbar, newToolName);
    });

    document.addEventListener("keydown", function(event)
    {
        var downKey = String.fromCharCode(event.keyCode).toLowerCase();
        for (var key in toolbar.tools)
        {
            var tool = toolbar.tools[key];
            if ((tool.key == downKey))
            {
                selectTool(toolbar, tool.name);
            }
        }
    });

    return toolbar;
}

function addTool(toolbar, opts)
{
    // TODO: maybe tool names shouldn't be strings
    var tool = {
        name: opts.name,
        key: opts.key,
        optionElement: createAndAppend("option", toolbar.selectElement),
        isAvailable: true,
        // TODO: image
    }
    toolbar.tools[tool.name] = tool;
    tool.optionElement.value = tool.name;
    tool.optionElement.innerHTML = opts.name;
}

function selectTool(toolbar, newToolName)
{
    if (!toolbar.tools.hasOwnProperty(newToolName))
    {
        throw "Toolbar: No such tool!";
    }

    if (!toolbar.tools[newToolName].isAvailable)
    {
        return;
    }

    if (toolbar.selectedToolName != "")
    {
        var previousTool = toolbar.tools[toolbar.selectedToolName];
        previousTool.optionElement.selected = false;
    }

    toolbar.selectedToolName = newToolName;
    toolbar.selectElement.value = newToolName;
}

function setToolbarAvailableTools(toolbar, availableToolNames)
{
    // remove all tools
    for (var toolName in toolbar.tools)
    {
        var tool = toolbar.tools[toolName];
        if (tool.isAvailable)
        {
            toolbar.selectElement.removeChild(tool.optionElement);    
        }
        tool.isAvailable = false;
    }

    // add available tools
    for (var toolName of availableToolNames)
    {
        if (!toolbar.tools.hasOwnProperty(toolName))
        {
            throw ("Toolbar: no tool with name \"" + toolName + "\"");
        }

        var tool = toolbar.tools[toolName];
        tool.isAvailable = true;
        toolbar.selectElement.appendChild(tool.optionElement);
    }
                                                                                                            
    if (availableToolNames.length > 0)
    {
        selectTool(toolbar, availableToolNames[0]);
    }
    else
    {
        setElementIsVisible(toolbar.div, false);
    }

    if (availableToolNames.length <= 1)
    {
        toolbar.selectElement.disabled = true;
        //setElementIsVisible(toolbar.div, false);
    }

}

// ! Graphs/Plots

function createGraphHere(opts)
{
    var graph = createGraph(opts);
    insertHere(graph.div);
    return graph;
}

function createGraph(opts)
{
    var graph = {};

    graph.div = createElement("div");
    if (opts.label)
    {
        graph.div.innerHTML = opts.label;
    }
    var canvas = createAndAppend("canvas", graph.div);
    graph.div.classList.add("graph");
    canvas.width = 400;
    canvas.height = 200;

    graph.renderer = createRenderer(canvas);

    graph.curves = [];
    graph.areas = [];
    graph.bars = [];
    graph.limits = {
        xMin: "auto",
        xMax: "auto",
        yMin: "auto",
        yMax: "auto",
    };
    graph.isVisible = true;

    graph.update = opts.update;
    // TODO: some kind of global updater, so each thing doesn't have to have its own

    if (graph.update)
    {
        var updater = function()
        {
            graph.update(graph);
            drawGraph(graph);
            window.requestAnimationFrame(updater);
        }

        updater();
    }

    return graph;
}

function addAxes(graph, opts)
{
    combineWithDefaults(opts,
    {
        x: 0,
        y: 0,
    })
    graph.axesEnabled = true;
    graph.xAxis = opts.y;
    graph.yAxis = opts.x;
}

function addCurve(graph, opts)
{
    combineWithDefaults(opts,
    {
        color: Color.black,
    });

    var curve = {
        pointCount: Math.min(opts.x.length, opts.y.length),
        xs: opts.x,
        ys: opts.y,
        color: opts.color,
    };

    graph.curves.push(curve);
}

function addArea(graph, opts)
{
    combineWithDefaults(opts,
    {
        color: Color.black,
    });
    var count = opts.x.length;
    var area = {
        count: count,
        x: function(i)
        {
            return (i < count) ? opts.x[i] : opts.x[2 * count - 1 - i];
        },
        y: function(i)
        {
            return (i < count) ? opts.yMin[i] : opts.yMax[2 * count - 1 - i];
        },
        color: opts.color,
    }
    graph.areas.push(area);
}

function addBars(graph, opts)
{
    combineWithDefaults(opts,
    {
        bars: []
    });

    graph.bars = graph.bars.concat(opts.bars);
}

function addHistogram(graph, opts)
{
    var values = opts.values.slice();
    arraySort(values);
    var barWidth = (opts.max - opts.min) / opts.barCount;
    var bars = [];
    for (var i = 0; i < opts.barCount; i++)
    {
        var bar = {
            start: opts.min + i * barWidth,
            end: opts.min + (i + 1) * barWidth,
            value: 0,
            color: Color.red,
        };
        bars.push(bar);
    }
    var barIndex = 0;
    for (var i = 0;
        (i < values.length) && (barIndex < opts.barCount); i++)
    {
        var value = values[i];
        var bar = bars[barIndex];
        if (value < opts.min)
        {
            continue;
        }
        if (value < bar.end)
        {
            bar.value += 1;
        }
        else
        {
            barIndex++;
        }
    }

    addBars(histogram,
    {
        bars: bars
    });
}

function setGraphLimits(graph, limits)
{
    for (var key in limits)
    {
        var value = limits[key];
        if (value !== undefined)
        {
            graph.limits[key] = limits[key];
        }
    }
}

function setGraphVisible(graph, isVisible)
{
    graph.isVisible = isVisible;
    setElementIsVisible(graph, isVisible);
}

function maximumBy(array, f)
{
    var max = -Number.MAX_VALUE;
    for (var i = 0; i < array.length; i++)
    {
        var x = f(array[i]);

        if (x > max)
        {
            max = x;
        }
    }
    return max;
}

function updateAutoLimits(autoLimits, x, y)
{
    if (x < autoLimits.xMin)
    {
        autoLimits.xMin = x;
    }
    if (x > autoLimits.xMax)
    {
        autoLimits.xMax = x;
    }

    if (y < autoLimits.yMin)
    {
        autoLimits.yMin = y;
    }
    if (y > autoLimits.yMax)
    {
        autoLimits.yMax = y;
    }
}

function getLimits(graph)
{
    // Figure out limits

    var autoLimits = {
        xMin: Number.MAX_VALUE,
        xMax: -Number.MAX_VALUE,
        yMin: Number.MAX_VALUE,
        yMax: -Number.MAX_VALUE,
    }
    for (var curveIndex = 0; curveIndex < graph.curves.length; curveIndex++)
    {
        var curve = graph.curves[curveIndex];
        for (var i = 0; i < curve.pointCount; i++)
        {
            var x = curve.xs[i];
            var y = curve.ys[i];
            updateAutoLimits(autoLimits, x, y);
        }
    }

    for (var areaIndex = 0; areaIndex < graph.areas.length; areaIndex++)
    {
        var area = graph.areas[areaIndex];
        for (var i = 0; i < area.count; i++)
        {
            var x = area.x(i);
            var yMin = area.y(i);
            var yMax = area.y(area.count + i);
            updateAutoLimits(autoLimits, x, yMin);
            updateAutoLimits(autoLimits, x, yMax);
        }
    }

    for (var barIndex = 0; barIndex < graph.bars.length; barIndex++)
    {
        var bar = graph.bars[barIndex];
        updateAutoLimits(autoLimits, bar.start, 0);
        updateAutoLimits(autoLimits, bar.end, bar.value);
    }

    if (graph.axesEnabled)
    {
        updateAutoLimits(autoLimits, graph.yAxis, graph.xAxis);
    }



    var limits = {};

    for (var key in graph.limits)
    {
        if (graph.limits[key] == "auto")
        {
            limits[key] = autoLimits[key];
        }
        else
        {
            limits[key] = graph.limits[key];
        }
    }

    var paddingFactor = 0.05;
    var minimumPadding = 0.00001;
    var xPadding = atLeast(minimumPadding, paddingFactor * (limits.xMax - limits.xMin));
    var yPadding = atLeast(minimumPadding, paddingFactor * (limits.yMax - limits.yMin));

    var paddings = {
        xMin: -xPadding,
        xMax: xPadding,
        yMin: -yPadding,
        yMax: yPadding,
    };

    for (var key in graph.limits)
    {
        if (graph.limits[key] == "auto")
        {
            limits[key] += paddings[key];
        }
    }

    return limits;
}

function drawGraph(graph)
{
    if (graph.isVisible)
    {
        var limits = getLimits(graph);

        setLeftTopRightBottom(graph.renderer.bounds,
            limits.xMin, limits.yMax,
            limits.xMax, limits.yMin
        );
        updateRendererBounds(graph.renderer);

        // Clear and draw

        clearRenderer(graph.renderer);

        //drawArrow(graph.renderer, v2(0, 0), v2(100, 1));
        if (graph.axesEnabled)
        {
            var gray = Color.gray;
            var maxArrowHeadLength = 10;
            drawArrow(graph.renderer, v2(limits.xMin, graph.xAxis), v2(limits.xMax, graph.xAxis), gray, maxArrowHeadLength);
            drawArrow(graph.renderer, v2(graph.yAxis, limits.yMin), v2(graph.yAxis, limits.yMax), gray, maxArrowHeadLength);
        }

        for (var areaIndex = 0; areaIndex < graph.areas.length; areaIndex++)
        {
            var area = graph.areas[areaIndex];
            drawPolygonFunctions(graph.renderer, area.x, area.y, 2 * area.count, area.color);
        }

        for (var curveIndex = 0; curveIndex < graph.curves.length; curveIndex++)
        {
            var curve = graph.curves[curveIndex];
            drawTrajectoryUnzipped(graph.renderer, curve.xs, curve.ys, curve.color);
        }
        if (graph.bars.length > 0)
        {
            var barWidth = (limits.xMax - limits.xMin) / graph.bars.length;
            for (var barIndex = 0; barIndex < graph.bars.length; barIndex++)
            {
                var bar = graph.bars[barIndex];
                var barRect = setLeftTopRightBottom(new Rectangle(), bar.start, 0, bar.end, bar.value);
                drawRectangle(graph.renderer, barRect, bar.color);
            }
        }
    }

    // Reset state
    graph.areas.length = 0;
    graph.curves.length = 0;
    graph.bars.length = 0;
}

// ! Time logs

function createTimeLog(opts)
{
    var timeLog = {
        range: 1,
        time: [],
        data:
        {},
    };

    copyObject(timeLog, opts);

    return timeLog;
}

function addToLog(timeLog, time, data)
{
    var tooOldCount = -1;
    while ((time - timeLog.time[++tooOldCount]) > timeLog.range)
    {};
    timeLog.time.splice(0, tooOldCount);
    for (var key in timeLog.data)
    {
        timeLog.data[key].splice(0, tooOldCount);
    }

    timeLog.time.push(time);
    for (var key in data)
    {
        if (timeLog.data[key])
        {
            timeLog.data[key].push(data[key]);
        }
        else
        {
            timeLog.data[key] = [data[key]];
        }
    }
}

function smoothLast(data, opts)
{
    var options = {
        smoothingWindowSize: data.length,
        smoothingFactor: 0,
    };
    copyObject(options, opts);
    var smoothingWindowSize = clamp(2, Math.floor(options.smoothingWindowSize), data.length);
    var smoothingFactor = clamp(0, options.smoothingFactor, 1);
    var cosFactor = tau / (smoothingWindowSize - 1);
    var windowSum = 0;
    for (var i = 0; i < smoothingWindowSize; i++)
    {
        var w = lerp(1, smoothingFactor, Math.cos(i * cosFactor));
        windowSum += w * data[data.length - 1 - i];
    }
    var windowAverage = windowSum / smoothingWindowSize;
    return windowAverage;
}

// ! Time series

function createTimeSeriesHere(opts)
{
    var timeSeries = createTimeSeries(opts);
    insertHere(timeSeries.div);
    return timeSeries;
}

function createTimeSeries(opts)
{
    var timeSeries = {
        graph: createGraph(
        {}),
        timeLog: createTimeLog(
        {
            range: opts.timeRange,
        }),
        yMin: opts.yMin,
        yMax: opts.yMax,
        update: opts.update,
        updater: null,
        div: null,
    }

    timeSeries.div = timeSeries.graph.div;
    timeSeries.updater = function()
    {
        var newData = timeSeries.update();
        addToLog(timeSeries.timeLog, newData.time, newData.data);
        for (var key in timeSeries.timeLog.data)
        {
            var values = timeSeries.timeLog.data[key];
            addCurve(timeSeries.graph,
            {
                x: timeSeries.timeLog.time,
                y: values
            });
        }
        addAxes(timeSeries.graph,
        {
            x: arrayLast(timeSeries.timeLog.time) - timeSeries.timeLog.range,
            y: 0,
        });
        setGraphLimits(timeSeries.graph,
        {
            yMin: timeSeries.yMin,
            yMax: timeSeries.yMax,
        });
        drawGraph(timeSeries.graph);
        window.requestAnimationFrame(timeSeries.updater);
    }

    timeSeries.updater();

    return timeSeries;
}

// ! Measurements

function getTotalEnergy(simulation)
{
    return simulation.particles.reduce(function(acc, p)
    {
        if (isFinite(p.potentialEnergy))
        {
            acc += p.potentialEnergy;
        }
        if (isFinite(p.kineticEnergy))
        {
            acc += p.kineticEnergy;
        }
        return acc;
    }, 0);
}

function getTotalPressure(simulation)
{
    var wallVector = v2.alloc();
    var pressure = 0;
    for (var wallIndex = 0; wallIndex < simulation.walls.length; wallIndex++) {
        var wall = simulation.walls[wallIndex];
        v2.subtract(wallVector, wall.vertices[1], wall.vertices[0]);
        var wallLength = v2.magnitude(wallVector);
        var wallPressure = v2.magnitude(wall.force) / wallLength;
        pressure += wallPressure;
    }
    v2.free(wallVector);

    return pressure;
}

// ! Regions

function Region()
{
    this.bounds = new Rectangle();
    this.color = Color.transparent;
}

// ! Measurement regions

function createMeasurementRegion()
{
    var region = {};
    region.bounds = new Rectangle();
    region.color = Color.black;
    region.overlayColor = Color.transparent;
    region.measurements = {
        time: [],
        energy: [],
        temperature: [],
        count: [],
        virialPressure: [],
        pressure: [],
        smoothedPressure: [],
    }
    return region;
}

function setColdHotRegions(simulation)
{
    var leftRegion = createMeasurementRegion();
    copyRectangle(leftRegion.bounds, simulation.leftRect);
    leftRegion.color = Color.blue;
    leftRegion.overlayColor = withAlpha(Color.blue, 0.2);

    var rightRegion = createMeasurementRegion();
    copyRectangle(rightRegion.bounds, simulation.rightRect);
    rightRegion.color = Color.red;
    rightRegion.overlayColor = withAlpha(Color.red, 0.2);

    simulation.measurementRegions = [leftRegion, rightRegion];
}

// ! Colors

var Color = {};

function addColor(name, rgba)
{
    Color[name] = {
        name: name,
        rgba: rgba,
        css: cssFromRGBA(rgba),
    };
}

function hexColor(name, hex)
{
    var rgba = [];
    for (var i = 0; i < 3; i++)
    {
        var shift = hex >> ((2 - i) * 8);
        rgba[i] = (shift & 0xFF) / 0xFF;
    }
    rgba[3] = 1.0;

    return {
        name: name,
        rgba: rgba,
        css: cssFromRGBA(rgba),
    };
}

function cssFromRGBA(rgba)
{
    return ["rgba(",
        Math.round(rgba[0] * 255), ",",
        Math.round(rgba[1] * 255), ",",
        Math.round(rgba[2] * 255), ",",
        rgba[3], ")"
    ].join("");
}

addColor("red", [0.7, 0.2, 0.2, 1]);
addColor("green", [0, 1, 0, 1]);
addColor("blue", [0.1, 0.2, 0.8, 1]);
addColor("yellow", [1, 0.8, 0, 1]);
addColor("orange", [1, 0.3, 0, 1]);
addColor("purple", [1, 0, 1, 1]);
addColor("black", [0, 0, 0, 1]);
addColor("white", [0, 0, 0, 1]);
addColor("gray", [0.5, 0.5, 0.5, 1]);
addColor("transparent", [0, 0, 0, 0]);


// inject these colors as class css
document.addEventListener("DOMContentLoaded", function()
{
    var styleElement = createAndAppend("style", document.head);
    var styleSheet = styleElement.sheet;
    for (var key in Color)
    {
        var color = Color[key];
        var rule = "." + color.name + "{color: " + color.css + ";}";
        styleSheet.insertRule(rule, 0);
    }
});

Color.niceSwatch = [
    Color.black,
    hexColor("blue", 0x4E638E),
    hexColor("brown", 0xd4996a),
    hexColor("greenish", 0x41817F),
    hexColor("lightBrown", 0xD4B06A),
    hexColor("darkBlue", 0x152A55),
    hexColor("purple", 0x8D478A),
];

function withAlpha(color, alpha)
{
    var rgba = [color.rgba[0], color.rgba[1], color.rgba[2], alpha];
    return {
        name: color.name,
        rgba: rgba,
        css: cssFromRGBA(rgba),
    }
}

// ! Constants

var tau = 2 * Math.PI;

var bonkSound = new Audio("/assets/sounds/bonk.wav");
var solvedSound = new Audio("/assets/sounds/solved.wav");

solvedSound.volume = 0.5;

// ! Shapes

var ShapeType = Object.freeze(
{
    circle: 0,
    polygon: 1,
});

var Circle = function()
{
    this.type = ShapeType.circle;
    this.centerPosition = v2(0, 0);
    this.radius = 1;
}

var Polygon = function()
{
    this.type = ShapeType.polygon;
    this.vertices = [];
}

var PhysicalObject = function(shape)
{
    this.shape = shape;
    this.mass = Infinity;
    this.velocity = v2(0, 0);
}

// ! Walls

function Wall(start, end)
{
    this.shapeType = ShapeType.polygon;
    this.vertices = [start, end];

    this.force = v2(0, 0);

    this.mass = Infinity;
    this.velocity = v2(0, 0);

}

// ! Particle object

var Particle = function()
{
    this.position = v2(0, 0);
    this.velocity = v2(0, 0);
    this.acceleration = v2(0, 0);
    this.deltaPosition = v2(0, 0);

    this.kineticEnergy = 0;
    this.potentialEnergy = 0;
    this.pressure = 0;
    this.virial = 0;

    this.color = Color.black;
    this.bounds = new Rectangle();
    this.radius = 1;
    this.mass = 1;

    this.type = 0;

    this.gridCol = -1;
    this.gridRow = -1;

    this.isRemoved = false;
}

// ! Initialization

function groupedPosition(simulation, particleIndex)
{
    var boxBounds = simulation.boxBounds;
    var smallCenteredRect = new Rectangle().setCenterWidthHeight(
        boxBounds.center, boxBounds.width / 5, boxBounds.height / 5
    );
    return randomPointInRect(smallCenteredRect);
}

function halvesPosition(simulation, particleIndex)
{
    if (particleIndex % 2 == 0)
    {
        return randomPointInRect(simulation.leftRect);
    }
    else
    {
        return randomPointInRect(simulation.rightRect);
    }
}

var triangularLatticePosition = function()
{

    var latticeX = v2(0, 0);
    var latticeY = v2(0, 0);

    return function(out, particleIndex, latticeSpacing)
    {
        // NOTE: this is the formula for triangular numbers inverted
        var triangularNumber = Math.floor((Math.sqrt(8 * particleIndex + 1) - 1) / 2);
        var rest = particleIndex - triangularNumber * (triangularNumber + 1) / 2;
        var integerX = rest;
        var integerY = triangularNumber - rest;
        var overallRotation = -tau / 12;
        v2.setPolar(latticeX, latticeSpacing * integerX, overallRotation);
        v2.setPolar(latticeY, latticeSpacing * integerY, overallRotation + tau / 6);
        return v2.add(out, latticeX, latticeY);
    }
}();

var rectangularLatticePosition = function()
{
    var latticeX = v2(0, 0);
    var latticeY = v2(0, 0);

    return function(out, particleIndex, latticeSpacing)
    {
        if (particleIndex == 0)
        {
            v2.set(out, 0, 0);
            return out;
        }
        var layer = Math.floor((Math.sqrt(particleIndex) + 1) / 2);
        var rest = particleIndex - squared(2 * layer - 1);
        var quadrant = Math.floor(rest / (2 * layer));
        var integerX = layer;
        var integerY = (rest % (2 * layer)) - layer + 1;
        var rotationAngle = quadrant * tau / 4;
        v2.setPolar(latticeX, latticeSpacing * integerX, rotationAngle);
        v2.setPolar(latticeY, latticeSpacing * integerY, rotationAngle + tau / 4);
        return v2.add(out, latticeX, latticeY);
    }
}();

var hexagonalLatticePosition = function()
{

    var latticeX = v2(0, 0);
    var latticeY = v2(0, 0);

    return function(out, particleIndex, latticeSpacing)
    {
        // NOTE: this adds the particles in a spiral by figuring out their coordinates in
        // one of 6 triangular lattices
        if (particleIndex == 0)
        {
            v2.set(out, 0, 0);
            return out;
        }
        var k = particleIndex - 1;
        var layer = Math.floor((Math.sqrt(8 * (k / 6) + 1) - 1) / 2) + 1; // NOTE: 1-indexed
        var rest = k - 6 * layer * (layer - 1) / 2;
        var triangleIndex = Math.floor(rest / layer);
        var integerX = layer;
        var integerY = rest % layer;
        var rotationAngle = triangleIndex * tau / 6;
        v2.setPolar(latticeX, latticeSpacing * integerX, rotationAngle);
        var shape = 2; // 1: spiral, 2: hexagon
        v2.setPolar(latticeY, latticeSpacing * integerY, rotationAngle + shape * tau / 6);
        return v2.add(out, latticeX, latticeY);
    }
}();

function randomVelocity(maxSpeed)
{
    var speed = randomInInterval(0, maxSpeed);
    var direction = randomUnitVector();
    return v2.scale(direction, direction, speed);
}

function randomUnitVector()
{
    var angle = randomInInterval(0, tau);
    return v2(Math.cos(angle), Math.sin(angle));
}

function uniformVelocity(simulation, particleIndex)
{
    return randomVelocity(simulation.parameters.maxInitialSpeed);
}



function identicalVelocity(simulation, particleIndex)
{
    return v2(0, -simulation.parameters.maxInitialSpeed);
}

function twoColors(simulation, particleIndex)
{
    if (particleIndex % 2 == 0)
    {
        return Color.black;
    }
    else
    {
        return Color.red;
    }
}

// ! particle generators

function generateParticles(simulation, count, generator)
{
    for (var particleIndex = 0; particleIndex < count; particleIndex++)
    {
        var particle = generator(simulation, particleIndex);
        simulation.particles.push(particle);
    }
}

function groupedParticleGenerator(simulation, particleIndex)
{
    var particle = new Particle();
    particle.position = groupedPosition(simulation, particleIndex);
    particle.velocity = uniformVelocity(simulation, particleIndex);
    return particle;
}

function fallingParticleGenerator(simulation, particleIndex)
{
    var particle = new Particle();
    particle.position = groupedPosition(simulation, particleIndex);
    particle.velocity = identicalVelocity(simulation, particleIndex);
    return particle;
}

function twoColorParticleGenerator(simulation, particleIndex)
{
    var particle = new Particle();
    particle.position = halvesPosition(simulation, particleIndex);
    particle.velocity = uniformVelocity(simulation, particleIndex);
    particle.color = twoColors(simulation, particleIndex);
    return particle;
}

function latticeParticleGenerator(simulation, particleIndex)
{
    var particle = new Particle();
    particle.position = hexagonalLatticePosition(simulation, particleIndex);
    return particle;
}

function addParticlesRandomly(simulation, newParticles)
{
    var maxTryCount = 10;
    var candidates = [];
    var startingNewParticleIndex = 0;

    if (simulation.particles.length == 0)
    {
        var newParticle = newParticles[0];
        var r = newParticle.radius;
        var b = simulation.boxBounds;
        var x = randomInInterval(b.left + r, b.right - r);
        var y = randomInInterval(b.bottom + r, b.top - r);
        v2.set(newParticle.position, x, y);
        addParticle(simulation, newParticle);
        candidates.push(newParticle);
        startingNewParticleIndex = 1;
    }
    else
    {
        for (var particleIndex = 0; particleIndex < simulation.particles.length; particleIndex++)
        {
            candidates.push(simulation.particles[particleIndex]);
        }
    }

    for (var newParticleIndex = startingNewParticleIndex; newParticleIndex < newParticles.length; newParticleIndex++)
    {
        var newParticle = newParticles[newParticleIndex];
        var isSearching = true;
        while (isSearching)
        {
            var randomCandidateIndex = randomInt(candidates.length);
            var candidate = candidates[randomCandidateIndex];
            var minRadius = candidate.radius + newParticle.radius;
            var maxRadius = 2 * minRadius;
            var tryCount = 0;
            while (isSearching)
            {
                tryCount += 1;
                if (tryCount > maxTryCount)
                {
                    arrayRemoveElementAt(candidates, randomCandidateIndex);
                    if (candidates.length == 0)
                    {
                        return;
                    }
                    else
                    {
                        break;
                    }
                }
                var randomRadius = randomInInterval(minRadius, maxRadius);
                var deltaPosition = randomUnitVector();
                v2.scale(deltaPosition, deltaPosition, randomRadius);
                v2.add(newParticle.position, candidate.position, deltaPosition);
                if (!isColliding(simulation, newParticle))
                {
                    isSearching = false;
                }
            }
        }

        if (addParticle(simulation, newParticle))
        {
            candidates.push(newParticle);
        };
    }
}

// ! Billiards

function triangleNumber(k)
{
    return k * (k + 1) / 2;
}

function initBilliards(simulation, rectangle, layerCount)
{
    simulation.parameters.isOnlyHardSpheres = true;

    var r = rectangle;

    var firstParticle = new Particle();
    firstParticle.color = Color.red;
    v2.set(firstParticle.position, r.left + r.width / 4, r.center[1]);
    addParticle(simulation, firstParticle);

    var margin = 0.1;
    var available = 1 - 2 * margin;
    var triangleWidth = available * rectangle.width / 2;
    var triangleHeight = available * rectangle.height;

    var particleRadius = 1;
    var latticeSpacing = 2.03 * particleRadius;

    if (layerCount === undefined)
    {
        var heightInParticles = triangleHeight / latticeSpacing;
        // NOTE: next line isn't exact
        var widthInParticleLayers = triangleWidth / (Math.sqrt(3) / 2 * latticeSpacing);
        layerCount = Math.floor(Math.min(heightInParticles, widthInParticleLayers));
    }
    

    var triangleParticleCount = triangleNumber(layerCount);

    for (var particleIndex = 0; particleIndex < triangleParticleCount; particleIndex++) {
        var particle = new Particle();
        triangularLatticePosition(particle.position, particleIndex, latticeSpacing);
        particle.position[0] += margin * rectangle.width / 2;
        particle.position[1] += rectangle.center[1];
        addParticle(simulation, particle);
    }
}

function billiardsPosition(out, particleIndex, latticeSpacing)
{
    if (particleIndex == 0)
    {
        v2.set(out, -3 * latticeSpacing, 0);
    }
    else
    {
        triangularLatticePosition(out, particleIndex - 1, latticeSpacing)
        out[0] += 2 * latticeSpacing;
    }
    return out;
}

function isBilliardsTriangleSplit(simulation)
{
    var cueFunction = function(){
        var totalEnergy = getTotalEnergy(simulation);
        var firstBall = simulation.particles[0];
        var firstEnergy = firstBall.kineticEnergy + firstBall.potentialEnergy;
        var triangleEnergy = totalEnergy - firstEnergy;
        return (triangleEnergy > 1);    
    }
    
    return cueFunction;
}

// ! Particle types

var LennardJonesInteraction = function()
{
    this.strength = 1;
    this.separation = 2;
}

var RepulsiveInteraction = function()
{
    this.strength = 1;
    this.separation = 2;
}

function symmetricIndex(a, b)
{
    var x = Math.min(a, b);
    var y = Math.max(a, b);
    var index = x + (y * (y + 1) / 2);
    return index;
}

function setInteraction(simulation, a, b, interaction)
{
    var index = symmetricIndex(a, b);
    simulation.interactions[index] = interaction;
    updateGrid(simulation);
}

function getInteraction(simulation, a, b)
{
    var index = symmetricIndex(a, b);
    if (simulation.interactions[index] === undefined)
    {
        simulation.interactions[index] = new RepulsiveInteraction();
    }
    return simulation.interactions[index];
}

function setWallsAlongBorder(simulation)
{
    var b = simulation.boxBounds;
    var corners = [
        v2(b.left, b.bottom),
        v2(b.right, b.bottom),
        v2(b.right, b.top),
        v2(b.left, b.top),
    ];

    simulation.walls = [];
    for (var i = 0; i < corners.length; i++)
    {
        var wall = new Wall(corners[i], corners[(i + 1) % corners.length]);
        simulation.walls.push(wall);
    }
}

function setBoxWidth(simulation, boxWidth)
{
    var boxHeight = boxWidth / simulation.canvas.width * simulation.canvas.height;
    updateBounds(simulation, boxWidth, boxHeight);
}

function setBoxHeight(simulation, boxHeight)
{
    var boxWidth = boxHeight / simulation.canvas.height * simulation.canvas.width;
    updateBounds(simulation, boxWidth, boxHeight);
}

function updateBounds(simulation, boxWidth, boxHeight)
{
    // TODO: scale regions with the updated bounds?

    var origin = v2(0, 0);

    setCenterWidthHeight(
        simulation.boxBounds,
        origin, boxWidth, boxHeight
    );

    updateGrid(simulation);

    copyRectangle(simulation.renderer.bounds, simulation.boxBounds);
    updateRendererBounds(simulation.renderer);
}

function updateGrid(simulation)
{
    var maxSeparation = 0;
    var minSeparation = Infinity;
    for (var interactionIndex = 0; interactionIndex < simulation.interactions.length; interactionIndex++) {
        var interaction = simulation.interactions[interactionIndex];

        if ((!interaction) || (!interaction.separation))
        {
            continue;    
        }
        
        if (interaction.separation > maxSeparation)
        {
            maxSeparation = interaction.separation;
        }
        
        if (interaction.separation < minSeparation)
        {
            minSeparation = interaction.separation;
        }
    }
    var maxCellSideLength = minSeparation / 2;
    var colCount = atLeast(1, Math.ceil(simulation.boxBounds.width / maxCellSideLength));
    var rowCount = atLeast(1, Math.ceil(simulation.boxBounds.height / maxCellSideLength));

    simulation.particleGrid = {
        cells: new Array(colCount * rowCount),
        colCount: colCount,
        rowCount: rowCount,
        dx: simulation.boxBounds.width / colCount,
        dy: simulation.boxBounds.height / rowCount,
        cutoffInteractionRange: maxSeparation * simulation.parameters.cutoffFactor,
    };
}


// ! Particle updating

function addParticle(simulation, particle)
{
    var isInside = simulation.parameters.isPeriodic || doesRectContainPoint(simulation.boxBounds, particle.position);
    var maxParticleCount = simulation.parameters.maxParticleCount;
    var notTooMany = (0 == maxParticleCount) || (simulation.particles.length < maxParticleCount)
    var isSuccessful = isInside && notTooMany && (!isColliding(simulation, particle));
    if (isSuccessful)
    {
        simulation.particles.push(particle);
    }
    return isSuccessful;
}

function isColliding(simulation, particle)
{
    // collision with other particles

    var epsilon = 0.00001;

    for (var particleIndex = 0; particleIndex < simulation.particles.length; particleIndex++) {
        var otherParticle = simulation.particles[particleIndex];
        var radiusSum = particle.radius + otherParticle.radius;
        var squaredDistance = v2.squaredDistance(particle.position, otherParticle.position);
        if (squaredDistance < square(radiusSum - epsilon))
        {
            return true;
        }
    }

    // collision with walls

    var isCollidingWithWall = false;

    if (simulation.walls)
    {

        var particleFromWall = v2.alloc();

        for (var wallIndex = 0; wallIndex < simulation.walls.length; wallIndex++) {
            var wall = simulation.walls[wallIndex];

            shortestVectorFromLine(particleFromWall, particle.position, wall.vertices[1], wall.vertices[0]);

            var squaredDistance = v2.square(particleFromWall);
            if (squaredDistance < square(particle.radius))
            {
                isCollidingWithWall = true
                break;
            }
        }

        v2.free(particleFromWall);
    }
    return isCollidingWithWall;
}

function moveOutOfCollision(simulation, particle)
{
    var relativePosition = v2.alloc();
    var wallVector = v2.alloc();

    var hasCollisions = true;
    while (hasCollisions)
    {
        hasCollisions = false;
        if (simulation.walls)
        {
            for (var wallIndex = 0; wallIndex < simulation.walls.length; wallIndex++)
            {
                var wall = simulation.walls[wallIndex];

                shortestVectorFromLine(relativePosition, particle.position, wall.vertices[1], wall.vertices[0]);

                var squaredDistance = v2.square(relativePosition);
                if (squaredDistance < square(particle.radius))
                {
                    var distance = Math.sqrt(squaredDistance);
                    var overlapRatio = (particle.radius - distance) / distance;
                    v2.scaleAndAdd(particle.position,
                        particle.position, relativePosition, overlapRatio);
                    hasCollisions = true;
                    break;
                }
            }
            if (hasCollisions)
            {
                continue;
            }
        }

        // for (var otherParticleIndex = 0; otherParticleIndex < simulation.particles.length; otherParticleIndex++)
        // {
        //     var otherParticle = simulation.particles[otherParticleIndex];
        //     if (otherParticle === particle)
        //     {
        //         continue;
        //     }

        //     var distanceLimit = particle.radius + otherParticle.radius;
        //     v2.subtract(relativePosition, otherParticle.position, particle.position);
        //     var squaredDistance = v2.square(relativePosition);

        //     if (squaredDistance < square(distanceLimit))
        //     {
        //         var distance = Math.sqrt(squaredDistance);
        //         var overlapRatio = (distanceLimit - distance) / distance;

        //         // NOTE: move particles according to their relative size, 
        //         // otherwise very big particles might have problems
        //         // v2.scaleAndAdd(particle.position,
        //         //     particle.position, relativePosition, -overlapRatio * otherParticle.radius / distanceLimit);
        //         // v2.scaleAndAdd(otherParticle.position,
        //         //     otherParticle.position, relativePosition, overlapRatio * particle.radius / distanceLimit);

        //         v2.scaleAndAdd(particle.position,
        //             particle.position, relativePosition, -overlapRatio);

        //         hasCollisions = true;
        //         break;
        //     }
        // }
    }

    v2.free(relativePosition);
    v2.free(wallVector);
}

function removeParticle(simulation, particleIndex)
{
    var particle = simulation.particles[particleIndex];
    simulation.particles.splice(particleIndex, 1);
    particle.isRemoved = true;
}

function worldFromPage(renderer, pagePosition)
{
    var canvasBounds = renderer.canvas.getBoundingClientRect();
    var canvasX = pagePosition[0] - canvasBounds.left;
    var canvasY = pagePosition[1] - canvasBounds.top;
    return worldFromCanvas(renderer, v2(canvasX, canvasY));
}

function square(x)
{
    return x * x;
}

function findClosestParticle(simulation, position)
{
    var minDistance = Infinity;
    var closestParticleIndex = -1;
    for (var particleIndex = 0; particleIndex < simulation.particles.length;
        ++particleIndex)
    {
        var particle = simulation.particles[particleIndex];

        var distanceToCenter = v2.distance(position, particle.position);
        var distanceToRim = distanceToCenter - particle.radius;
       
        if (distanceToRim < minDistance)
        {
            minDistance = distanceToRim;
            closestParticleIndex = particleIndex;
        }
    }
    return closestParticleIndex;
}

function createSimulationHere(opts)
{
    var simulation = createSimulation(opts);
    insertHere(simulation.div);
    return simulation;
}

function createSimulation(opts)
{
    var simulation = {
        pixelWidth: opts.pixelWidth || 400,
        pixelHeight: opts.pixelHeight || 400,
		worldWidth: opts.worldWidth || 20,
		worldHeight: opts.worldHeight,
        initialize: opts.initialize,
        parameters: {},
    };

    simulation.div = createElement("div");
    simulation.div.classList.add("simulation");

    simulation.canvas = createAndAppend("canvas", simulation.div);
    simulation.canvas.width = simulation.pixelWidth;
    simulation.canvas.height = simulation.pixelHeight;
    simulation.canvas.classList.add("simulationCanvas");

    simulation.controlsDiv = createAndAppend("div", simulation.div);
    simulation.resetButton = createButton({
        label: "Reset",
        action: function() {
            simulation.resetButton.classList.remove("pulsing");
            resetSimulation(simulation);
        },
    });
    simulation.controlsDiv.appendChild(simulation.resetButton);
    simulation.controlsDiv.classList.add("controls");

    simulation.toolbar = createToolbar();
    simulation.controlsDiv.appendChild(simulation.toolbar.div);
    addTool(simulation.toolbar,
    {
        name: "move",
        key: "m",
    });
    addTool(simulation.toolbar,
    {
        name: "impulse",
        key: "i",
    });

    addTool(simulation.toolbar,
    {
        name: "repel",
        key: "r",
    });
    addTool(simulation.toolbar,
    {
        name: "attract",
        key: "a",
    });

    addTool(simulation.toolbar,
    {
        name: "create",
        key: "c",
    });
    addTool(simulation.toolbar,
    {
        name: "delete",
        key: "d",
    });

    selectTool(simulation.toolbar, "move");

    simulation.renderer = createRenderer(simulation.canvas);

    resetSimulation(simulation);

    return simulation;
}

function setResetReminder(simulation, isReminding)
{
    setElementClass(simulation.resetButton, "pulsing", isReminding);
}

function resetSimulation(simulation)
{
    //
    // default parameters
    //

    var p = simulation.parameters;

    // general
    p.maxInitialSpeed = 0.1;
    p.soundEnabled = false;
    p.maxParticleCount = 0;
    p.shouldRemindOnEscape = true;

    // box
    p.isPeriodic = false;

    // collisions
    p.isOnlyHardSpheres = false;
    p.isSlowCollisionEnabled = false;
    p.isSlowParticleParticleCollisionEnabled = false;
    p.coefficientOfRestitution = 1;

    // time-related
    p.simulationTimePerSecond = 5;
    p.dt = 0.005;
    p.simulationSpeed = 1;

    // TODO: begone!
    // measurements
    p.measurementWindowLength = 100;
    p.measurementEnabled = true;
    p.pressureWindowSize = 1000;
    p.displayWallPressure = false;

    // forces
    p.velocityAmplification = 1;
    p.gravityAcceleration = 0;
    p.friction = 0;
    p.cutoffFactor = 2.5;
    p.wallStrength = 1;

    // user forces
    p.dragStrength = 1;
    p.repelStrength = 1;
    p.attractStrength = 1;
    p.impulseStrength = 1;

    // thermostat
    p.thermostatSpeed = 0;
    p.thermostatTemperature = 0.01;

    // reset stuff
    var s = simulation;
    simulation.walls = null;
    simulation.particleGenerator = function()
    {
        return new Particle();
    };
    // NOTE: this is so graphs don't get confused when we reset
    // TODO: don't make it rely on this hack please
    simulation.time = simulation.time || 0;
    simulation.times = [];
    simulation.previousTimestamp = 0;
    simulation.timeLeftToSimulate = 0;
    simulation.isFirstFrameAfterPause = true;

    // TODO: should this really be reset?
    simulation.pausedByUser = false;

    simulation.particles = [];
    simulation.interactions = [];
    simulation.trajectory = [];

    simulation.boxBounds = new Rectangle();
    simulation.regions = [];

    getInteraction(simulation, 0, 0); // NOTE: this get sets up default interaction
    setBoxWidth(simulation, 25);

    // ! User initialization

    simulation.initialize(simulation);

    if (simulation.parameters.isOnlyHardSpheres)
    {
        simulation.parameters.dt = simulation.parameters.simulationTimePerSecond / 60;
        simulation.parameters.isSlowCollisionEnabled = true;
        simulation.parameters.isSlowParticleParticleCollisionEnabled = true;
    }

    if (simulation.walls === null)
    {
        simulation.walls = [];
        setWallsAlongBorder(simulation);    
    }

    // ! Measurements

    var totalRegion = createMeasurementRegion();
    copyRectangle(totalRegion.bounds, simulation.boxBounds);
    simulation.measurementRegions = [totalRegion];

    simulation.entropy = [];
    simulation.probability = [];


    // ! Keyboard

    simulation.downKeys = [];

    document.addEventListener("keydown", function(event)
    {
        var downKey = String.fromCharCode(event.keyCode).toLowerCase();
        simulation.downKeys.push(downKey);
    });

    document.addEventListener("keyup", function(event)
    {
        var releasedKey = String.fromCharCode(event.keyCode).toLowerCase();
        simulation.downKeys = simulation.downKeys.filter(function(key)
        {
            return key != releasedKey;
        });
    });

    // ! Mouse

    simulation.mouse = {
        active: false,
        worldPosition: v2(0, 0),
        leftButton:
        {
            down: false,
            transitionCount: 0,
        },
        rightButton:
        {
            down: false,
            transitionCount: 0,
        },
        mode: MouseMode.none,
        selectedParticleIndices: [],
        activeParticle: null,
        billiardCue:
        {
            visible: false,
            start: v2(0, 0),
            end: v2(0, 0),
            strength: 1,
            length: 0.8,
        }
    }

    function updateMouseButton(button, isDown)
    {
	    button.transitionCount += button.down ^ isDown;
		button.down = isDown;
    }
	
	function updateMouseButtonsFromEvent(event, isDown)
	{
		if (simulation.mouse.active)
		{
			if (event.button == 0) {
				updateMouseButton(simulation.mouse.leftButton, isDown);
			}
			if (event.button == 2) {
				updateMouseButton(simulation.mouse.rightButton, isDown);
			}
		}
	}

    function updateMousePositionFromEvent(event)
    {
        if (simulation.mouse.active)
        {
            simulation.mouse.worldPosition = worldFromPage(simulation.renderer, v2(event.clientX, event.clientY));
            event.preventDefault();
        }
    }

    // NOTE: only listen to mouse events that start on this canvas
    simulation.canvas.addEventListener("mousedown", function(event)
    {
        simulation.mouse.active = true;
        updateMouseButtonsFromEvent(event, true);
        updateMousePositionFromEvent(event);
    });
    document.addEventListener("mouseup", function(event)
    {
		updateMouseButtonsFromEvent(event, false);
        updateMousePositionFromEvent(event);
        simulation.mouse.active = false;
    });
    document.addEventListener("mousemove", updateMousePositionFromEvent);

    // ! Pause when simulation is not visible

    function pauseIfHidden(event)
    {
        // TODO: maybe just keep one playing at a time, the one we are scrolling towards
        var divBounds = simulation.div.getBoundingClientRect();

        var isAboveViewport = divBounds.bottom < 0;
        var isBelowViewport = divBounds.top > window.innerHeight;

        var isAutoPaused = document.hidden || isAboveViewport || isBelowViewport;

        if (isAutoPaused)
        {
            if (simulation.requestFrameId)
            {
                window.cancelAnimationFrame(simulation.requestFrameId);
                simulation.requestFrameId = null;
            }
        }
        else
        {
            if (simulation.requestFrameId === null)
            {
                simulation.isFirstFrameAfterPause = true;
                simulation.requestFrameId = window.requestAnimationFrame(simulation.updateFunction);
            }
        }
    }

    document.addEventListener('visibilitychange', pauseIfHidden);
    document.addEventListener("scroll", pauseIfHidden);
    document.addEventListener("resize", pauseIfHidden);
    window.addEventListener("load", pauseIfHidden);


    // ! Start simulation

    simulation.updateFunction = function(timestamp)
    {
        updateSimulation(simulation.updateFunction, simulation, timestamp);
    };

    simulation.requestFrameId = window.requestAnimationFrame(simulation.updateFunction);

    return simulation;
}

function createEnum(names, isBitfield)
{
    var enumerable = {};
    for (var nameIndex = 0; nameIndex < names.length; ++nameIndex)
    {
        var name = names[nameIndex];
        enumerable[name] = isBitfield ? (1 << nameIndex) : nameIndex;
    }
    return Object.freeze(enumerable);
}

var MouseMode = createEnum(["none", "move", "select", "repel", "attract", "create", "delete", "impulse"]);

// ! Simulation


function drawSimulation(simulation)
{
    clearRenderer(simulation.renderer);

    for (var regionIndex = 0; regionIndex < simulation.regions.length; regionIndex++)
    {
        var region = simulation.regions[regionIndex];
        var overlayColor = withAlpha(region.color, 0.2);
        drawRectangle(simulation.renderer, region.bounds, overlayColor);
    }

    for (var i = 0; i < simulation.walls.length; i++)
    {
        var wall = simulation.walls[i];
        // TODO: one drawWalls call, to reduce number of draw calls
        drawTrajectory(simulation.renderer, wall.vertices, Color.black);
    }

    simulation.renderer.context.globalCompositeOperation = "darken";
    drawParticles(simulation.renderer, simulation.particles, simulation.parameters.isPeriodic);
    simulation.renderer.context.globalCompositeOperation = "source-over";

    if (simulation.parameters.trajectoryEnabled)
    {
        drawTrajectory(simulation.renderer, simulation.trajectory, Color.blue);
    }

    if (simulation.parameters.displayWallPressure)
    {
        var arrowStart = v2.alloc();
        var arrowEnd = v2.alloc();
        for (var wallIndex = 0; wallIndex < simulation.walls.length; wallIndex++) {
            var wall = simulation.walls[wallIndex];
            v2.add(arrowStart, wall.vertices[0], wall.vertices[1]);
            v2.scale(arrowStart, arrowStart, 0.5);

            var length = 10;
            v2.scaleAndAdd(arrowEnd, arrowStart, 
                wall.force, - 1 / length);

            drawArrow(simulation.renderer, arrowStart, arrowEnd, Color.black);
        }
        v2.free(arrowStart);
        v2.free(arrowEnd);
    }

    // user interactions
    simulation.renderer.context.globalCompositeOperation = "xor";

    if (simulation.mouse.mode == MouseMode.move)
    {
        if (simulation.mouse.activeParticle)
        {
            drawTrajectory(simulation.renderer, 
                [simulation.mouse.activeParticle.position, simulation.mouse.worldPosition], 
                Color.black);
        }

    }

    if (simulation.mouse.mode == MouseMode.impulse)
    {
        if (simulation.mouse.activeParticle)
        {
            drawArrow(simulation.renderer, simulation.mouse.activeParticle.position, simulation.mouse.worldPosition, Color.black);    
        }
    }

    simulation.renderer.context.globalCompositeOperation = "source-over";

}

var updateSimulation = function()
{
    // TODO: replace all of these with v2.alloc and v2.free
    var relativePosition = v2(0, 0);
    var relativeVelocity = v2(0, 0);
    var deltaVelocity = v2(0, 0);
    var deltaAcceleration = v2(0, 0);

    var gravityAcceleration = v2(0, 0);

    return function(updateFunction, simulation, timestamp)
    {

        // ! Process input

        // TODO: handle periodic boundary conditions in mouse input

        if (simulation.mouse.leftButton.transitionCount > 0)
        {
            if (simulation.mouse.mode == MouseMode.impulse)
            {
                var particle = simulation.mouse.activeParticle;
                if (particle)
                {
                    var strength = simulation.parameters.impulseStrength;
                    v2.subtract(relativePosition, simulation.mouse.worldPosition, particle.position);
                    v2.scaleAndAdd(particle.velocity, 
                        particle.velocity, relativePosition, strength);
                }
            }

            simulation.mouse.mode = MouseMode.none;
            simulation.mouse.activeParticle = null;
        }

        if (simulation.mouse.leftButton.down)
        {
            var closestParticleIndex = findClosestParticle(simulation, simulation.mouse.worldPosition);
            var closestParticleExists = (closestParticleIndex >= 0);

            if (closestParticleExists)
            {
                var closestParticle = simulation.particles[closestParticleIndex];
                var maxDistance = 5 / simulation.pixelWidth * simulation.boxBounds.width;
                var distanceToCenter = v2.distance(closestParticle.position, simulation.mouse.worldPosition);
                var distanceToRim = distanceToCenter - closestParticle.radius;
                closestParticleExists = (distanceToRim < maxDistance);
            }

            // TODO: separate MouseMode and tool concepts
            // TODO: make tool an enum too

            var leftButtonJustDown = (simulation.mouse.leftButton.transitionCount > 0);
            if (leftButtonJustDown)
            {
                simulation.mouse.mode = MouseMode[simulation.toolbar.selectedToolName];

                if (simulation.mouse.mode === MouseMode.impulse)
                {
                    if (closestParticleExists)
                    {
                        simulation.mouse.activeParticle = closestParticle;
                    }
                    else
                    {
                        simulation.mouse.mode = MouseMode.none;
                    }
                }

                if (simulation.mouse.mode === MouseMode.move)
                {
                    if (closestParticleExists)
                    {
                        simulation.mouse.activeParticle = closestParticle;

                        simulation.mouse.selectedParticleIndices.length = 0;
                        simulation.mouse.selectedParticleIndices.push(closestParticleIndex);    
                    }
                    else
                    {
                        simulation.mouse.mode = MouseMode.none;
                    }
                }
                
                if (simulation.mouse.mode === MouseMode.select)
                {
                    simulation.mouse.selectAnchorPoint = v2.clone(simulation.mouse.worldPosition);
                    simulation.mouse.selectedParticleIndices.length = 0;
                }
            }

            if (simulation.mouse.mode === MouseMode.create)
            {
                var particle = simulation.particleGenerator();
                v2.copy(particle.position, simulation.mouse.worldPosition);
                addParticle(simulation, particle);
            }
            else if (simulation.mouse.mode === MouseMode.delete)
            {
                if (closestParticleExists)
                {
                    removeParticle(simulation, closestParticleIndex);
                }
            }
        }

        if (!simulation.pausedByUser)
        {


            var params = simulation.parameters;

            // ! Keep track of time

            var dt = params.dt;

            var elapsedSeconds = (timestamp - simulation.previousTimestamp) / 1000;

            // NOTE: attempt to avoid stalls by limiting max frame time
            elapsedSeconds = atMost(1 / 30, elapsedSeconds);

            simulation.previousTimestamp = timestamp;

            if (simulation.isFirstFrameAfterPause)
            {
                simulation.isFirstFrameAfterPause = false;
                elapsedSeconds = dt / params.simulationTimePerSecond;
            }

            simulation.timeLeftToSimulate += elapsedSeconds * params.simulationTimePerSecond;

            // ! Simulation loop with fixed timestep

            while (simulation.timeLeftToSimulate >= dt)
            {
                simulation.timeLeftToSimulate -= dt;

                // TODO: interpolate drawing? Shouldn't be needed with such a small timestep
                simulation.time += dt;

                v2.set(gravityAcceleration, 0, -params.gravityAcceleration);

                // ! Equations of motion
                var particles = simulation.particles;

                // langevin setup

                applyLangevinNoise(particles, params.thermostatSpeed, params.thermostatTemperature, dt);

                for (var particleIndex = 0; particleIndex < particles.length;
                    ++particleIndex)
                {
                    var particle = particles[particleIndex];

                    // Scale velocities with delta temperature

                    v2.scale(particle.velocity, particle.velocity,
                        Math.pow(params.velocityAmplification, dt));

                    // velocity verlet
                    v2.scaleAndAdd(particle.velocity, particle.velocity, particle.acceleration, 0.5 * dt);


                    // reset stuff before next loop
                    v2.copy(particle.acceleration, gravityAcceleration);
                    particle.potentialEnergy = -v2.inner(particle.position, gravityAcceleration);
                    particle.pressure = 0;
                    particle.virial = 0;
                }

                // ! Collision

                // TODO: ensure this works with time backwards (dt < 0),
                // perhaps by using deltaPosition, and a remainingTime that's always positive
                // or by flipping velocities when time gets < 0 and having dt > 0

                var remainingTime = dt;

                if (params.isSlowCollisionEnabled)
                {
                    var collisionPool = new Pool(createCollision);
                    var collisions = [];
                    var firstCollisions = [];

                    for (var particleIndex = 0; particleIndex < particles.length; ++particleIndex)
                    {
                        var particle = particles[particleIndex];

                        for (var otherParticleIndex = 0; otherParticleIndex < particleIndex; ++otherParticleIndex)
                        {
                            var otherParticle = particles[otherParticleIndex];
                            recordParticleParticleCollision(
                                collisionPool, collisions,
                                particle, otherParticle,
                                remainingTime, simulation.boxBounds, params.isPeriodic);
                        }
                        for (var wallIndex = 0; wallIndex < simulation.walls.length; wallIndex++)
                        {
                            var wall = simulation.walls[wallIndex];
                            recordWallParticleCollision(
                                collisionPool, collisions,
                                wall, particle,
                                remainingTime);
                        }
                    }

                    var maxCollisionPassCount = 1000;
                    var collisionPassCount = 0;
                    while (collisions.length != 0)
                    {
                        // make sure we don't hang here
                        collisionPassCount += 1;
                        if (collisionPassCount > maxCollisionPassCount)
                        {
                            break;
                        }

                        // take first collision
                        var firstIndex = arrayMinIndex(collisions, function(c)
                        {
                            return c.time;
                        });

                        var firstCollisionTime = collisions[firstIndex].time;
                        remainingTime -= firstCollisionTime;

                        // advance time for everyone
                        for (var particleIndex = 0; particleIndex < particles.length; particleIndex++)
                        {
                            var particle = particles[particleIndex];
                            v2.scaleAndAdd(particle.position, particle.position, particle.velocity, firstCollisionTime);
                        }

                        firstCollisions.length = 0;
                        for (var collisionIndex = 0; collisionIndex < collisions.length; collisionIndex++)
                        {
                            var collision = collisions[collisionIndex];
                            // TODO: epsilon here?
                            if (collision.time === firstCollisionTime)
                            {
                                firstCollisions.push(collision);
                            }

                            // NOTE: do subtraction after comparison to avoid floating arithmetic weirdness
                            collision.time -= firstCollisionTime;
                        }


                        for (var firstCollisionIndex = 0; firstCollisionIndex < firstCollisions.length; firstCollisionIndex++)
                        {
                            // ! Collision
                            // TODO: energy corrections (to conserve energy)

                            var firstCollision = firstCollisions[firstCollisionIndex];

                            var normal = v2.alloc();
                            var massSum = firstCollision.first.mass + firstCollision.second.mass;

                            v2.subtract(relativeVelocity, firstCollision.first.velocity, firstCollision.second.velocity);
                            v2.projectOntoNormal(deltaVelocity, relativeVelocity, firstCollision.normal);

                            var velocityScalingFirst = (firstCollision.second.mass == Infinity) ?
                                1 : (firstCollision.second.mass / massSum);
                            var velocityScalingSecond = (firstCollision.first.mass == Infinity) ?
                                1 : (firstCollision.first.mass / massSum);

                            var restitutionFactor = 1 + params.coefficientOfRestitution;

                            v2.scaleAndAdd(firstCollision.first.velocity, firstCollision.first.velocity,
                                deltaVelocity, -restitutionFactor * velocityScalingFirst);
                            v2.scaleAndAdd(firstCollision.second.velocity, firstCollision.second.velocity,
                                deltaVelocity, restitutionFactor * velocityScalingSecond);

                            // remove collisions for involved particles

                            for (var collisionIndex = 0; collisionIndex < collisions.length; collisionIndex++)
                            {
                                var c = collisions[collisionIndex];

                                if ((c.first === firstCollision.first) || (c.first === firstCollision.second) || (c.second === firstCollision.first) || (c.second === firstCollision.second))
                                {
                                    collisions.splice(collisionIndex--, 1);
                                }
                            }

                            // calculate any new collisions for involved particles

                            var isParticleParticleCollision = (firstCollision.type == CollisionType.particleParticle);

                            for (var particleIndex = 0; particleIndex < particles.length; particleIndex++)
                            {
                                // TODO: make firstCollision.first and second be indices
                                var particle = particles[particleIndex];

                                if ((particle !== firstCollision.first) && (particle !== firstCollision.second))
                                {
                                    if (isParticleParticleCollision)
                                    {
                                        recordParticleParticleCollision(
                                            collisionPool, collisions,
                                            particle, firstCollision.first,
                                            remainingTime, simulation.boxBounds, params.isPeriodic);
                                    }
                                    else
                                    {
                                        recordWallParticleCollision(
                                            collisionPool, collisions,
                                            firstCollision.first, particle,
                                            remainingTime);
                                    }
                                    recordParticleParticleCollision(
                                        collisionPool, collisions,
                                        particle, firstCollision.second,
                                        remainingTime, simulation.boxBounds, params.isPeriodic);
                                }
                            }

                            for (var wallIndex = 0; wallIndex < simulation.walls.length; wallIndex++)
                            {
                                var wall = simulation.walls[wallIndex];

                                if (isParticleParticleCollision)
                                {
                                    recordWallParticleCollision(
                                        collisionPool, collisions,
                                        wall, firstCollision.first,
                                        remainingTime);
                                }
                                recordWallParticleCollision(
                                    collisionPool, collisions,
                                    wall, firstCollision.second,
                                    remainingTime);
                            }

                            poolFree(collisionPool, firstCollision);
                        }
                    }
                }

                for (var particleIndex = 0; particleIndex < particles.length; particleIndex++)
                {
                    // move last bit
                    var particle = particles[particleIndex];
                    v2.scaleAndAdd(particle.position, particle.position, particle.velocity, remainingTime);

                    // filter NaNs, infinities, and particles that escape the box
                    var isFinite = v2.isFinite(particle.position);
                    var isOutside = (!params.isPeriodic) && (!doesRectContainPoint(simulation.boxBounds, particle.position));

                    if ((!isFinite) || isOutside)
                    {
                        removeParticle(simulation, particleIndex);
                        particleIndex -= 1;

                        if (params.shouldRemindOnEscape)
                        {
                            setResetReminder(simulation, true);
                        }
                    }
                }

                if (!params.isSlowCollisionEnabled)
                {
                    // reset wall forces
                    for (var wallIndex = 0; wallIndex < simulation.walls.length; wallIndex++) {
                        var wall = simulation.walls[wallIndex];
                        v2.set(wall.force, 0, 0);
                    }

                    // ! put particles in grid

                    for (var i = 0; i < simulation.particleGrid.cells.length; i++)
                    {
                        simulation.particleGrid.cells[i] = -1;
                    }

                    for (var particleIndex = 0; particleIndex < simulation.particles.length; particleIndex++)
                    {
                        var particle = simulation.particles[particleIndex];
                        var col = Math.floor((particle.position[0] - simulation.boxBounds.left) / simulation.particleGrid.dx);
                        var row = Math.floor((particle.position[1] - simulation.boxBounds.bottom) / simulation.particleGrid.dy);
                        col = mod(col, simulation.particleGrid.colCount);
                        row = mod(row, simulation.particleGrid.rowCount);
                        var cellIndex = row * simulation.particleGrid.colCount + col;
                        simulation.particleGrid.cells[cellIndex] = particleIndex;
                        particle.gridCol = col;
                        particle.gridRow = row;
                    }

                    // ! Calculate force and energy

                    var squareCutoffFactor = square(params.cutoffFactor);

                    var gridRadiusX = Math.ceil(simulation.particleGrid.cutoffInteractionRange / simulation.particleGrid.dx);
                    var boxRadiusX = (simulation.particleGrid.colCount - 1) / 2;
                    var dxMin = - atMost(Math.floor(boxRadiusX), gridRadiusX);
                    var dxMax = atMost(Math.ceil(boxRadiusX), gridRadiusX);
                    var gridRadiusY = Math.ceil(simulation.particleGrid.cutoffInteractionRange / simulation.particleGrid.dy);
                    var boxRadiusY = (simulation.particleGrid.rowCount - 1) / 2;
                    var dyMin = - atMost(Math.floor(boxRadiusY), gridRadiusY);
                    var dyMax = atMost(Math.ceil(boxRadiusY), gridRadiusY);

                    for (var particleIndex = 0; particleIndex < particles.length; particleIndex++)
                    {
                        var particle = particles[particleIndex];

                        for (var dy = dyMin; dy <= dyMax; dy++)
                        {
                            var row = mod(particle.gridRow + dy, simulation.particleGrid.rowCount);
                            var rowIndex = simulation.particleGrid.colCount * row;
                            for (var dx = dxMin; dx <= dxMax; dx++)
                            {
                                var col = mod(particle.gridCol + dx, simulation.particleGrid.colCount);
                                var cellIndex = rowIndex + col;

                                var otherParticleIndex = simulation.particleGrid.cells[cellIndex];
                                if ((otherParticleIndex < 0) || (particleIndex >= otherParticleIndex))
                                {
                                    continue;
                                }
                                var otherParticle = particles[otherParticleIndex];

                                var interaction = getInteraction(simulation, particle.type, otherParticle.type);
                                if (interaction === null)
                                {
                                    continue;
                                }

                                v2.subtract(relativePosition, otherParticle.position, particle.position);

                                if (params.isPeriodic)
                                {
                                    v2.periodicize(relativePosition, relativePosition, simulation.boxBounds);
                                }

                                // NOTE: no forces across walls

                                var wallVector = v2.alloc();
                                var wallToParticle = v2.alloc();
                                var isAcrossWall = false;
                                for (var wallIndex = 0; wallIndex < simulation.walls.length; wallIndex++)
                                {
                                    var wall = simulation.walls[wallIndex];
                                    v2.subtract(wallVector, wall.vertices[1], wall.vertices[0]);
                                    v2.subtract(wallToParticle, particle.position, wall.vertices[0]);
                                    var intersection = intersectionOriginLineLine(wallVector, wallToParticle, relativePosition);
                                    isAcrossWall = ((0 < intersection.tLine) && (intersection.tLine < 1) && (0 < intersection.tOriginLine) && (intersection.tOriginLine < 1));
                                    if (isAcrossWall)
                                    {
                                        break;
                                    }
                                }
                                v2.free(wallToParticle);
                                v2.free(wallVector);
                                if (isAcrossWall)
                                {
                                    continue;
                                }

                                // ! Lennard Jones

                                var squaredDistance = v2.square(relativePosition);
                                var invSquaredDistance = 1 / squaredDistance;
                                var squareSeparation = square(interaction.separation);

                                var potentialEnergy = 0;
                                var virial = 0;

                                var isRepulsive = interaction instanceof RepulsiveInteraction;

                                if (isRepulsive)
                                {
                                    if (squaredDistance > squareSeparation)
                                    {
                                        continue;
                                    }
                                    potentialEnergy += interaction.strength;
                                }

                                // truncation
                                if (squaredDistance > (squareCutoffFactor * squareSeparation))
                                {
                                    continue;
                                }

                                // TODO: unsure about this one
                                if (!isRepulsive)
                                {
                                    // compensate truncation
                                    // NOTE: not really necessary
                                    // TODO: move this out of loop
                                    var b2 = 1 / squareCutoffFactor;
                                    var b6 = b2 * b2 * b2;
                                    potentialEnergy -= interaction.strength * (b6 - 2) * b6;
                                }

                                // ! Lennard-jones
                                var a2 = squareSeparation * invSquaredDistance;
                                var a6 = a2 * a2 * a2;
                                potentialEnergy += interaction.strength * (a6 - 2) * a6;
                                virial += interaction.strength * 12 * (a6 - 1) * a6;

                                // TODO: reimplement coulomb
                                if (false && isCoulombInteraction)
                                {
                                    // TODO: energy is positive in ground state, is that correct?
                                    var chargeProduct = (interaction == Interaction.coulombSame) ? 1 : -1;

                                    // NOTE: fake coulomb
                                    var coulombFactor = params.coulombStrength * chargeProduct;
                                    var coulombEnergy = coulombFactor * invSquaredDistance;
                                    virial += 2 * coulombEnergy;
                                    potentialEnergy += coulombEnergy;

                                }

                                // TODO: one loop for each interaction intead of one loop with a lot of ifs

                                var forceFactor = -virial * invSquaredDistance;

                                v2.scaleAndAdd(particle.acceleration, particle.acceleration,
                                    relativePosition, forceFactor / particle.mass);
                                v2.scaleAndAdd(otherParticle.acceleration, otherParticle.acceleration,
                                    relativePosition, -forceFactor / otherParticle.mass);

                                // Measurements

                                particle.potentialEnergy += potentialEnergy / 2;
                                otherParticle.potentialEnergy += potentialEnergy / 2;

                                var halfVirial = virial / 2;
                                particle.virial += halfVirial;
                                otherParticle.virial += halfVirial;
                                
                            }
                        }

                        // ! Wall forces

                        var particleFromWall = v2.alloc();

                        for (var wallIndex = 0; wallIndex < simulation.walls.length; wallIndex++)
                        {
                            var wall = simulation.walls[wallIndex];
                            
                            shortestVectorFromLine(particleFromWall, particle.position, wall.vertices[0], wall.vertices[1]);

                            var squaredDistanceToWall = v2.square(particleFromWall);
                            var squareSeparation = square(particle.radius);

                            if (squaredDistanceToWall < squareSeparation)
                            {
                                var invSquaredDistance = 1 / squaredDistanceToWall;

                                var a2 = squareSeparation * invSquaredDistance;
                                var a6 = a2 * a2 * a2;
                                particle.potentialEnergy += params.wallStrength * (a6 - 2) * a6;
                                particle.potentialEnergy += params.wallStrength; // NOTE: for repulsive
                                var virial = params.wallStrength * 12 * (a6 - 1) * a6;
                                particle.virial = virial;

                                var forceFactor = -virial * invSquaredDistance;

                                v2.scaleAndAdd(wall.force, wall.force, 
                                    particleFromWall, forceFactor);

                                v2.scaleAndAdd(particle.acceleration, particle.acceleration,
                                    particleFromWall, -forceFactor / particle.mass);
                            }
                        }

                        v2.free(particleFromWall);
                    }
                }


                for (var particleIndex = 0; particleIndex < simulation.particles.length; particleIndex++) {
                    var particle = simulation.particles[particleIndex];

                    // ! Friction
                    v2.scaleAndAdd(particle.acceleration, particle.acceleration,
                        particle.velocity, -params.friction / particle.mass);
                }

                // ! User forces

                var mouseToParticle = v2.alloc();

                // ! Attract tool

                if (simulation.mouse.mode === MouseMode.attract)
                {
                    for (var particleIndex = 0; particleIndex < simulation.particles.length; particleIndex++) {
                        var particle = simulation.particles[particleIndex];

                        v2.subtract(mouseToParticle, particle.position, simulation.mouse.worldPosition);

                        // NOTE: constant force
                        var repelFactor = - simulation.boxBounds.width / 10 / v2.magnitude(mouseToParticle);

                        v2.scaleAndAdd(particle.acceleration, particle.acceleration,
                            mouseToParticle, repelFactor * params.attractStrength / particle.mass);
                    }
                }

                // ! Repel tool

                if (simulation.mouse.mode === MouseMode.repel)
                {
                    for (var particleIndex = 0; particleIndex < simulation.particles.length; particleIndex++) {
                        var particle = simulation.particles[particleIndex];

                        v2.subtract(mouseToParticle, particle.position, simulation.mouse.worldPosition);

                        // NOTE: 1/r force
                        var repelFactor = simulation.boxBounds.width / v2.square(mouseToParticle);

                        v2.scaleAndAdd(particle.acceleration, particle.acceleration,
                            mouseToParticle, repelFactor * params.repelStrength / particle.mass);
                    }
                }

                // ! Move tool

                if (simulation.mouse.mode === MouseMode.move)
                {
                    var activeParticle = simulation.mouse.activeParticle;
                    // TODO: not really happy with the .isRemoved and the handling of the selectedParticles
                    if (!activeParticle.isRemoved)
                    {
                        v2.subtract(mouseToParticle, activeParticle.position, simulation.mouse.worldPosition);

                        for (var i = 0; i < simulation.mouse.selectedParticleIndices.length; i++)
                        {
                            var particle = particles[simulation.mouse.selectedParticleIndices[i]];

                            v2.scaleAndAdd(particle.acceleration, particle.acceleration,
                                mouseToParticle, -params.dragStrength / particle.mass);
                            v2.scaleAndAdd(particle.acceleration, particle.acceleration,
                                particle.velocity, -1 / particle.mass);
                        }    
                    }
                }

                v2.free(mouseToParticle);

                for (var particleIndex = 0; particleIndex < particles.length;
                    ++particleIndex)
                {
                    var particle = particles[particleIndex];

                    // finish velocity verlet
                    v2.scaleAndAdd(particle.velocity, particle.velocity, particle.acceleration, 0.5 * dt);

                    // calculate quantities

                    particle.kineticEnergy = 0.5 * particle.mass * v2.square(particle.velocity);

                    // ! Periodic boundary conditions
                    if (params.isPeriodic)
                    {
                        v2.periodicize(particle.position, particle.position, simulation.boxBounds);
                    }
                }

                applyLangevinNoise(particles, params.thermostatSpeed, params.thermostatTemperature, dt);

            }

            // ! Things done once per frame, not once per simulation step

            // ! Input cleanup

            simulation.mouse.leftButton.transitionCount = 0;
            simulation.mouse.rightButton.transitionCount = 0;

            // ! Trajectory

            if (params.trajectoryEnabled && (simulation.particles.length > 0))
            {
                simulation.trajectory.push(v2.clone(simulation.particles[0].position));
            }

            // ! Measurements

            if (params.measurementEnabled)
            {
                // TODO: record measurements for each simulation step, but only draw once?
                // maybe not, once per frame should be enough for showing

                var totalEntropy = 0;
                var probabilities = [];
                var counts = [];
                var totalArea = rectangleArea(simulation.boxBounds);

                var barWidth = 1 / simulation.measurementRegions.length;
                for (var regionIndex = 0; regionIndex < simulation.measurementRegions.length; regionIndex++)
                {
                    var region = simulation.measurementRegions[regionIndex];
                    var m = region.measurements;

                    // Add new value, remove old, crufty ones
                    m.time.push(simulation.time);
                    var tooOldCount = -1;
                    // NOTE: save more data than shown, to avoid weird autoscaling in plots
                    while ((simulation.time - m.time[++tooOldCount]) > 2 * params.measurementWindowLength)
                    {};

                    for (var key in m)
                    {
                        m[key].splice(0, tooOldCount);
                    }

                    var regionEnergy = 0;
                    var regionTemperature = 0;
                    var regionCount = 0;
                    var regionPressure = 0;
                    var regionVirialSum = 0;
                    var regionArea = rectangleArea(region.bounds);

                    for (var particleIndex = 0; particleIndex < simulation.particles.length; particleIndex++)
                    {
                        var particle = simulation.particles[particleIndex];

                        if (doesRectContainPoint(region.bounds, particle.position))
                        {
                            regionPressure += particle.pressure;
                            regionEnergy += (particle.potentialEnergy + particle.kineticEnergy);
                            regionTemperature += particle.kineticEnergy;
                            regionCount += 1;
                            regionVirialPressure = particle.virial;
                        }
                    }

                    regionTemperature /= regionCount;
                    var dimension = 2;
                    var regionVirialPressure = (regionVirialSum / dimension + regionTemperature * regionCount) / regionArea;


                    m.energy.push(regionEnergy);
                    m.temperature.push(regionTemperature);
                    m.count.push(regionCount);
                    m.pressure.push(regionPressure);
                    m.virialPressure.push(regionVirialPressure);



                    totalEntropy += microstateEntropy(regionCount / simulation.particles.length);
                    probabilities.push(regionArea / totalArea);
                    counts.push(regionCount);
                }

                // TODO: make a list with global visualizations too

                simulation.times.push(simulation.time);
                simulation.entropy.push(totalEntropy);
                simulation.probability.push(multinomial(probabilities, counts));

                var tooOldCount = -1;
                // NOTE: save more data than shown, to avoid weird autoscaling in plots
                while ((simulation.time - simulation.times[++tooOldCount]) > 2 * params.measurementWindowLength)
                {};

                simulation.entropy.splice(0, tooOldCount);
                simulation.times.splice(0, tooOldCount);
                simulation.probability.splice(0, tooOldCount);
            }
        }

        drawSimulation(simulation);

        simulation.requestFrameId = window.requestAnimationFrame(updateFunction);
    }
}();

// ! Interactions

function lennardJonesEnergy(r)
{
    var a6 = Math.pow(1 / r, 6);
    return (a6 - 2) * a6;
}

function lennardJonesForce(r)
{
    var invR = 1 / r;
    var a6 = Math.pow(invR, 6);
    return (12 * invR * (a6 * a6 - a6));
}

function lennardJonesVirial(invR2)
{
    var a6 = invR2 * invR2 * invR2;
    return (12 * (a6 * a6 - a6));
}

// TODO: maybe have all these be of the same form

function softLennardJonesEnergy(r, softness, n, m)
{
    var factor = 1 / (softness + Math.pow(r, n));
    var term = Math.pow(factor, m);
    return (term * term - 2 * term);
}

function softLennardJonesForce(r, softness, n, m)
{
    var factor = 1 / (softness + Math.pow(r, n));
    var term = Math.pow(factor, m);
    var preFactor = m * n * Math.pow(r, n - 1) * factor;
    return preFactor * 2 * (term * term - term);
}

function applyLangevinNoise(particles, viscosity, temperature, dt)
{
    if (viscosity > 0)
    {
        var viscosityFactor = Math.exp(-viscosity * dt * 0.5);
        var gaussianFactor = Math.sqrt((1 - square(viscosityFactor)));

        for (var particleIndex = 0; particleIndex < particles.length;
            ++particleIndex)
        {
            var particle = particles[particleIndex];

            var thermalVelocity = Math.sqrt(temperature / particle.mass);

            var gaussianVector = v2.alloc();
            // TODO: maybe divide by sqrt2? probably not
            v2.scale(particle.velocity, particle.velocity, viscosityFactor);
            v2.set(gaussianVector, randomGaussian(), randomGaussian());
            v2.scaleAndAdd(particle.velocity, particle.velocity,
                gaussianVector, gaussianFactor * thermalVelocity)
            v2.free(gaussianVector)
        }
    }
}



// ! Math

function isNumber(x)
{
    return (typeof x === "number");
}

function atLeast(a, b)
{
    return Math.max(a, b);
}

function atMost(a, b)
{
    return Math.min(a, b);
}

function clamp(a, x, b)
{
    return Math.max(a, Math.min(b, x));
}

function lerp(a, t, b)
{
    return ((1 - t) * a + t * b);
}

function mod(a, b)
{
    var result = a % b;
    if (result < 0)
    {
        result += b;
    }
    return result;
}

function microstateEntropy(p)
{
    if (p == 0)
    {
        return 0;
    }
    else
    {
        return -p * Math.log2(p);
    }
}

function squared(x)
{
    return x * x
};

function sum(array)
{
    return array.reduce(function(x, y)
    {
        return x + y;
    });
}

function binomial(n, k)
{
    var product = 1;
    for (var i = 0; i < k; i++)
    {
        product *= (n - 1 - i) / i;
    }
    return product;
}

var factorial = function()
{
    var cache = [1];

    return function(n)
    {
        if (n < 0)
        {
            return;
        }
        n = Math.floor(n);
        if (n >= cache.length)
        {
            for (var i = cache.length; i <= n; i++)
            {
                cache.push(cache[i - 1] * i);
            }
        }
        return cache[n];
    }
}();


function multinomial(probabilities, counts)
{
    var product = factorial(sum(counts));
    for (var i = 0; i < counts.length; i++)
    {
        product *= Math.pow(probabilities[i], counts[i]);
        product /= factorial(counts[i]);
    }
    return product;
}


// ! Rectangle



function Rectangle()
{
    this.left = 0;
    this.right = 0;
    this.top = 0;
    this.bottom = 0;
    this.width = 0;
    this.height = 0;
    this.center = v2(0, 0);
    return this;
}

function setLeftTopRightBottom(rectangle, left, top, right, bottom)
{
    rectangle.left = left;
    rectangle.right = right;
    rectangle.top = top;
    rectangle.bottom = bottom;
    rectangle.width = right - left;
    rectangle.height = top - bottom;
    v2.set(rectangle.center, (left + right) / 2, (top + bottom) / 2);
    return rectangle;
}

function setLeftTopWidthHeight(rectangle, left, top, width, height)
{
    rectangle.left = left;
    rectangle.top = top;
    rectangle.right = left + width;
    rectangle.bottom = top - height;
    rectangle.width = width;
    rectangle.height = height;
    v2.set(rectangle.center, left + width / 2, top + height / 2);
    return rectangle;
}

function setCenterWidthHeight(rectangle, center, width, height)
{
    var halfWidth = width / 2;
    var halfHeight = height / 2;
    rectangle.left = center[0] - halfWidth;
    rectangle.top = center[1] + halfHeight;
    rectangle.right = center[0] + halfWidth;
    rectangle.bottom = center[1] - halfHeight;
    rectangle.width = width;
    rectangle.height = height;
    v2.copy(rectangle.center, center);
    return rectangle;
}

function copyRectangle(newRect, rect)
{
    newRect.left = rect.left;
    newRect.right = rect.right;
    newRect.top = rect.top;
    newRect.bottom = rect.bottom;
    newRect.width = rect.width;
    newRect.height = rect.height;
    newRect.center = v2.clone(rect.center);
    return newRect;
}

function transformToRectFromRect(out, toRect, v, fromRect)
{
    var x = (v[0] - fromRect.left) / fromRect.width;
    var y = (v[1] - fromRect.bottom) / fromRect.height;
    out[0] = x * toRect.width + toRect.left;
    out[1] = y * toRect.height + toRect.bottom;
    return out;
}

function doesRectContainRect(outer, inner)
{
    var insideX = (outer.left <= inner.left) && (inner.right <= outer.right);
    var insideY = (outer.bottom <= inner.bottom) && (inner.top <= outer.top);
    return insideX && insideY;
}

function doesRectContainPoint(rectangle, point)
{
    var insideX = (rectangle.left <= point[0]) && (point[0] <= rectangle.right)
    var insideY = (rectangle.bottom <= point[1]) && (point[1] <= rectangle.top)
    return insideX && insideY;
}

function randomPointInRect(rect)
{
    return v2(randomInInterval(rect.left, rect.right),
        randomInInterval(rect.bottom, rect.top));
}

function randomDiscInRect(rect, radius)
{
    var x = randomInInterval(rect.left + radius, rect.right - radius);
    var y = randomInInterval(rect.bottom + radius, rect.top - radius);
    return v2(x, y);
}

function randomInInterval(a, b)
{
    return lerp(a, Math.random(), b);
}

function randomInt(max)
{
    return Math.floor(Math.random() * max);
}

function randomIntBetween(min, max)
{
    var d = max - min;
    var result = min + randomInt(d + 1);
    return result;
}

// NOTE: generates 2 at a time, saves the one not immediately returned
var randomGaussian = function()
{
    var returnX = true;
    var outX, outY;

    return function()
    {
        returnX = !returnX;

        if (returnX)
        {
            return outX;
        }

        var x, y, w;
        do {
            x = 2 * Math.random() - 1;
            y = 2 * Math.random() - 1;
            w = x * x + y * y;
        } while (w >= 1.0)

        w = Math.sqrt((-2 * Math.log(w)) / w);
        outX = x * w;
        outY = y * w;

        return outY;
    }
}();

function rectangleArea(rectangle)
{
    return (rectangle.width * rectangle.height);
}

// ! Intersection

function intersectionOriginCircleLine(
    circleRadius,
    lineStart, lineVector
)
{
    var dotAB = v2.inner(lineStart, lineVector);
    var bSq = v2.square(lineVector);
    var rootInput = square(dotAB) + bSq * (squared(circleRadius) - v2.square(lineStart));
    if ((bSq > 0) && (rootInput > 0))
    {
        var root = Math.sqrt(rootInput);
        var bSqInv = 1 / bSq;
        var t1 = (-dotAB - root) * bSqInv;
        var t2 = (-dotAB + root) * bSqInv;

        return {
            isIntersecting: true,
            t1: t1,
            t2: t2,
        }
    }
    else
    {
        return {
            isIntersecting: false
        };
    }
}

function intersectionOriginLineLine(originVector, start, vector)
{
    var invOuter = 1 / v2.outer(originVector, vector);
    var tOriginLine = v2.outer(start, vector) * invOuter;
    var tLine = v2.outer(start, originVector) * invOuter;
    return {
        tOriginLine: tOriginLine,
        tLine: tLine,
    };
}


// ! Collision

var CollisionType = Object.freeze(
{
    particleParticle: 0,
    wallParticle: 1,
});

function createCollision()
{
    return {
        time: 0,
        normal: v2(),
        type: CollisionType.particleParticle,
        first: null,
        second: null,
    };
}

// TODO: is this even needed?
var collisionEpsilon = 0;

function recordParticleParticleCollision(collisionPool, collisions, particle, otherParticle, remainingTime, boxBounds, isPeriodic)
{
    var relativePosition = v2.alloc();
    var relativeVelocity = v2.alloc();

    v2.subtract(relativePosition, particle.position, otherParticle.position);
    if (isPeriodic)
    {
        v2.periodicize(relativePosition, relativePosition, boxBounds);
    }
    v2.subtract(relativeVelocity, particle.velocity, otherParticle.velocity);

    var radiusSum = particle.radius + otherParticle.radius;
    var intersection = intersectionOriginCircleLine(radiusSum,
        relativePosition, relativeVelocity);
    if (intersection.isIntersecting && ((-collisionEpsilon) <= intersection.t1) && (intersection.t1 < remainingTime))
    {
        var collision = poolAlloc(collisionPool);
        collision.type = CollisionType.particleParticle;
        collision.first = particle;
        collision.second = otherParticle;
        collision.time = atLeast(0, intersection.t1);
        v2.scaleAndAdd(collision.normal, relativePosition, relativeVelocity, collision.time);
        v2.normalize(collision.normal, collision.normal);
        collisions.push(collision);
    }

    v2.free(relativePosition);
    v2.free(relativeVelocity);
}

function recordWallParticleCollision(collisionPool, collisions, wall, particle, remainingTime)
{
    // TODO: periodicize so that collisions work across periodic boundary

    var wallVector = v2.alloc();
    var wallNormal = v2.alloc();
    var relativeWallStart = v2.alloc();
    var particleRelativeEndpoint = v2.alloc();

    var wallStart = wall.vertices[0];
    var wallEnd = wall.vertices[1];

    // Test the walls

    v2.subtract(wallVector, wallEnd, wallStart);
    v2.normalize(wallNormal, wallVector);
    v2.perpCCW(wallNormal, wallNormal);

    // NOTE: Only check the wall facing the velocity
    v2.scale(wallNormal, wallNormal, -Math.sign(v2.inner(wallNormal, particle.velocity)));

    v2.subtract(relativeWallStart, wallStart, particle.position);
    v2.scaleAndAdd(relativeWallStart, relativeWallStart, wallNormal, particle.radius);

    var intersection = intersectionOriginLineLine(particle.velocity, relativeWallStart, wallVector);
    var isIntersectingSide = (0 <= intersection.tLine) && (intersection.tLine <= 1);
    var isIntersectingNow = ((-collisionEpsilon) <= intersection.tOriginLine) && (intersection.tOriginLine < remainingTime);
    if (isIntersectingSide && isIntersectingNow)
    {
        var collision = poolAlloc(collisionPool);
        collision.type = CollisionType.wallParticle;
        collision.first = wall;
        collision.second = particle;
        collision.time = atLeast(0, intersection.tOriginLine);
        v2.copy(collision.normal, wallNormal);
        collisions.push(collision);
    }
    else
    {
        // Test the endpoints

        for (var i = 0; i < 2; i++)
        {
            v2.subtract(particleRelativeEndpoint, particle.position, wall.vertices[i]);

            var intersection = intersectionOriginCircleLine(particle.radius, particleRelativeEndpoint, particle.velocity);
            if (intersection.isIntersecting && ((-collisionEpsilon) <= intersection.t1) && (intersection.t1 < remainingTime))
            {
                var collision = poolAlloc(collisionPool);
                collision.type = CollisionType.wallParticle;
                collision.first = wall;
                collision.second = particle;
                collision.time = atLeast(0, intersection.t1);
                v2.scaleAndAdd(collision.normal, particleRelativeEndpoint, particle.velocity, collision.time);
                v2.normalize(collision.normal, collision.normal);
                collisions.push(collision);
                break;
            }
        }
    }

    v2.free(wallVector);
    v2.free(wallNormal);
    v2.free(relativeWallStart);
    v2.free(particleRelativeEndpoint);
}

function shortestVectorFromLine(result, point, lineStart, lineEnd)
{
    var lineVector = v2.alloc();
    var pointFromLineStart = v2.alloc();

    v2.subtract(lineVector, lineEnd, lineStart);
    v2.subtract(pointFromLineStart, point, lineStart);

    var t = v2.inner(pointFromLineStart, lineVector) / v2.square(lineVector);
    t = clamp(0, t, 1);
    v2.scaleAndAdd(result, pointFromLineStart, lineVector, -t);
                                                            
    v2.free(lineVector)
    v2.free(pointFromLineStart);
}




const { prompt, StringPrompt } = require('enquirer');

async function getInputOfSample1() {
    const prompt = new StringPrompt(
        {
            type: 'input',
            name: 'sample1',
            message: 'Please input Sample 1 temperature inputs.'
        }
    );
    return prompt.run();
}

async function getInputOfSample2() {
    const prompt = new StringPrompt(
        {
            type: 'input',
            name: 'sample2',
            message: 'Please input Sample 2 temperature inputs.'
        }
    );
    return prompt.run();
}

async function getInputOfSample3() {
    const prompt = new StringPrompt(
        {
            type: 'input',
            name: 'sample3',
            message: 'Please input Sample 3 temperature inputs.'
        }
    );
    return prompt.run();
}

function freezing(value, cutPoint, cb) {
    if (value > cutPoint.freezingCut) {
        cb("unfreezing");
        return "normal";
    }
    return "freezing";
}

function boiling(value, cutPoint, cb) {
    if (value < cutPoint.boilingCut) {
        cb("unboiling");
        return "normal";
    }
    return "boiling";
}

function normal(value, cutPoint, cb) {
    if (value < cutPoint.freezingCut) {
        cb("freezing");
        return "freezing";
    }
    else if (value > cutPoint.boilingCut) {
        cb("boiling");
        return "boiling";
    }
    return "normal";
}

function statusSwitcher() {
    return {
        [Symbol.for("freezing")]: freezing,
        [Symbol.for("boiling")]: boiling,
        [Symbol.for("normal")]: normal
    }
}

function turn(status, value, cutPoint, output)
{
    const switcher = statusSwitcher();
    return switcher[Symbol.for(status)](parseFloat(value), cutPoint, (s) => {
        output.push(s);
    });
}

function getOutput(input, threshold) {
    return new Promise((resolve, reject) => {
        const inputs = input.split(' ').map(i => parseFloat(i).toFixed(1));
        const freezingCut = threshold.freezing + threshold.fluctuation;
        const boilingCut = threshold.boiling - threshold.fluctuation;
        const cutPoint = {
            freezingCut: freezingCut,
            boilingCut: boilingCut
        }
        let status = "normal";
        let output = [];
        
        inputs.forEach((v, i, arr) => {
            output.push(v);
            const s = status;
            status = turn(s, v, cutPoint, output);
            if((s === "boiling" || s === "freezing") && status === "normal")
            {
                status = turn(status, v, cutPoint, output);
            }
        });
        resolve(output);
    });
}

async function getThreshold() {
    return await prompt([
        {
            type: 'input',
            name: 'freezing',
            message: 'Please input freezing threshold.'
        },
        {
            type: 'input',
            name: 'boiling',
            message: 'Please input boiling threshold.'
        },
        {
            type: 'input',
            name: 'fluctuation',
            message: 'Please input fluctuation value.'
        }
    ]);
}

function checkInputs(threshold) {
    return new Promise((resolve, reject) => {
        const t = {
            freezing: parseFloat(threshold.freezing),
            boiling: parseFloat(threshold.boiling),
            fluctuation: parseFloat(threshold.fluctuation)
        };

        if (t.freezing > t.boiling) {
            reject(new Error("Freezing threshold should lower than boiling threshould."));
        }
        else if (t.freezing + t.fluctuation > t.boiling) {
            reject(new Error("Freezing + fluctuation should lower than boiling threshould."));
        }
        else if (t.boiling - t.fluctuation < t.freezing) {
            reject(new Error("Boiliing - fluctuation should greater than freezing threshould."));
        }
        return resolve(t);
    });
}

async function consoleExecution() {
    try {
        getThreshold().then(t => checkInputs(t)).then(t => {
            Promise.resolve().then(() => {
                return getInputOfSample1().then(i => {
                    getOutput(i, t).then(o => {
                        console.log(o.reduce((a, b) => `${a} ${b}`));
                    });
                });
            }).then(() => {
                return getInputOfSample2().then(i => {
                    getOutput(i, t).then(o => {
                        console.log(o.reduce((a, b) => `${a} ${b}`));
                    });
                });
            }).then(() => {
                return getInputOfSample3().then(i => {
                    getOutput(i, t).then(o => {
                        console.log(o.reduce((a, b) => `${a} ${b}`));
                    });
                });
            });
        })
    }
    catch (e) {
        return Promise.reject(e);
    }
    return Promise.resolve();
}

consoleExecution().catch(function (e) {
    console.log(e);
});


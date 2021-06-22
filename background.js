console.log("Plugin started");

const URL = "https://teachablemachine.withgoogle.com/models/DFviImW2m/";
let model, webcam, ctx, labelContainer, maxPredictions;

async function init() {
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    model = await tmPose.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    const size = 200;
    const flip = true;
    webcam = new tmPose.Webcam(size, size, flip);
    await webcam.setup();
    await webcam.play();

    window.requestAnimationFrame(loop);

    document.getElementById("webcam-container").appendChild(webcam.canvas);
}

async function loop(timestamp) {
    webcam.update();
    await predict();
    window.requestAnimationFrame(loop);
}

function doubleClickArticle(article) {
    const clickEvent = document.createEvent("MouseEvents");
    clickEvent.initEvent("dblclick", true, true);
    article.dispatchEvent(clickEvent);
}

function getVisibleArticle() {
    const articleList = document.querySelectorAll("article");
    const articleListArray = Array.from(articleList);
    const visibleArticles = articleListArray.filter(function (article) {
        const bounds = article.getBoundingClientRect();
        return bounds.top > 0 || bounds.bottom > 0;
    });
    visibleArticles.sort(function (a, b) {
        const boundsA = a.getBoundingClientRect();
        const boundsB = b.getBoundingClientRect();

        return boundsA.top - boundsB.top;
    });
    const [article1, article2] = visibleArticles;
    const windowHeight = window.innerHeight;
    const visibilityPercetageArticleA =
        article1.getBoundingClientRect().bottom / windowHeight;
    const visibilityPercetageArticleB =
        (windowHeight - article2.getBoundingClientRect().top) / windowHeight;
    if (visibilityPercetageArticleA > visibilityPercetageArticleB) {
        return article1;
    } else {
        return article2;
    }
}

async function predict() {
    const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
    const prediction = await model.predict(posenetOutput);
    var predictionsArray = prediction.map(function (o, i) {
        return { probability: o.probability.toFixed(2), event: o.className }
    })

    var i;
    var min = predictionsArray[0].probability
    var max = predictionsArray[0].probability
    var event = predictionsArray[0].className;
    var value;
    for (i = 1; i < predictionsArray.length; i++) {
        value = predictionsArray[i].probability
        if (value < min) min = value;
        if (value > max) max = value;
    }
    const index = predictionsArray.findIndex((list) => {
        return list.probability == max;
    })
    event = predictionsArray[index].event;


    getVisibleArticle();

    if (event === "Like") {
        likeArticle();
    } else if (event === "Dislike") {
        dislikeArticle();
    }
}


const webcamContainer = document.createElement("div");
webcamContainer.id = "webcam-container";
webcamContainer.style.display = "none";
document.body.appendChild(webcamContainer);

init();
$(document).ready(() => {
    const height = $("header").height() + 10;

    console.log(height);

    $("section.banner").css({
        "padding-top": height
    })
})
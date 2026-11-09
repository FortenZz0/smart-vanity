$(window).on("scroll", () => {
    return;
    const scroll = $(window).scrollTop()

    if (scroll >= 100)
    {
        $("header").addClass("scrolled")
        // $("header .container").addClass("py-3")
        // $("header .container").removeClass("py-5")
    }
    else
    {
        $("header").removeClass("scrolled")
        // $("header .container").removeClass("py-3")
        // $("header .container").addClass("py-5")
    }

    // console.log(scroll)
})
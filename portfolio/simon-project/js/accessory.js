function greenLight() {
    $('.top-left2').addClass('green');
    setTimeout(function () {
        $('.top-left2').removeClass('green');
    },800)
}

function redLight() {
    $('.top-right2').addClass('red');
    setTimeout(function () {
        $('.top-right2').removeClass('red');
    },800)
}

function yellowLight() {
    $('.bottom-left2').addClass('yellow');
    setTimeout(function () {
        $('.bottom-left2').removeClass('yellow');
    },800)
}

function blueLight() {
    $('.bottom-right2').addClass('blue');
    setTimeout(function () {
        $('.bottom-right2').removeClass('blue');
    },800)
}
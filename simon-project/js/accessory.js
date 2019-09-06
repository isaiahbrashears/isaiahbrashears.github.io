function greenLight() {
    $('.top-left2').addClass('green');
    setTimeout(function () {
        $('.top-left2').removeClass('green');
    },600)
}

function redLight() {
    $('.top-right2').addClass('red');
    setTimeout(function () {
        $('.top-right2').removeClass('red');
    },600)
}

function yellowLight() {
    $('.bottom-left2').addClass('yellow');
    setTimeout(function () {
        $('.bottom-left2').removeClass('yellow');
    },600)
}

function blueLight() {
    $('.bottom-right2').addClass('blue');
    setTimeout(function () {
        $('.bottom-right2').removeClass('blue');
    },600)
}
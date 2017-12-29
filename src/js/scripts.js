var resizeCallback = function () {
    $('.skill-item').each(
        function () {
            var newWidth = $(this).parent().width() * $(this).data('percent');
            $(this).width(0);
            $(this).animate({width: newWidth}, 1000);
        }
    );
};
$(document).ready(resizeCallback);

var resize;
window.onresize = function () {
    clearTimeout(resize);
    resize = setTimeout(
        function () {
            resizeCallback();
        },
        100
    );
};

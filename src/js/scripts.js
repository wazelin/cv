var resizeCallback = function () {
    $('.skill-item').each(
        function () {
            var newWidth = $(this).parent().width() * $(this).data('percent');
            $(this).width(0);
            $(this).animate({width: newWidth}, 1000);
        }
    );
    $('.icons-red').each(
        function () {
            $(this).animate({height: 14}, 2000);
        });
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

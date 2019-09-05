(function($) {

	"use strict";	

  
    $('.navigation').singlePageNav({
        currentClass : 'active'
    });


    $('.toggle-menu').click(function(){
        $('.responsive-menu').stop(true,true).slideToggle();
        return false;
    });
    
    $('.project-inside').click(function () {
        // var addressValue = $(this).children().children().attr("href");
        // console.log(addressValue)

        console.log('test')
    })



})(jQuery);







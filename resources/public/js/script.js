// Ready load page
$(function(){
    // animation options-buttuon detail.html
    {
        
        let optionClick = $('.product-option');
        let optionClickFirstChild = $('.product-option:first-child');
        optionClickFirstChild.addClass('selected');

        optionClick.click(function(){
            optionClick.removeClass('selected');
            $(this).addClass('selected');
        })
    }

    // animation select Sidebar account-setting.html
    {
        let optionClick = $('.main-sidebar-section .nav-link');
        optionClick.click(function() {
            optionClick.removeClass('selected');
            $(this).addClass('selected');
        });
    }


    "use strict";

    // Add active state to sidbar nav links
    var path = window.location.href; // because the 'href' property of the DOM element is the absolute path
        $("#layoutSidenav_nav .sb-sidenav a.nav-link").each(function() {
            if (this.href === path) {
                $(this).addClass("active");
            }
        });

    // Toggle the side navigation
    $("#sidebarToggle").on("click", function(e) {
        e.preventDefault();
        $("body").toggleClass("sb-sidenav-toggled");
    });

    // Add the following code if you want the name of the file appear on select
    $(".custom-file-input").on("change", function() {
        var fileName = $(this).val().split("\\").pop();
        $(this).siblings(".custom-file-label").addClass("selected").html(fileName);
    });
});




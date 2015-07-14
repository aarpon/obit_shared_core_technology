/**
 * DataViewer class
 * 
 * @author Aaron Ponti
 *
 */

/**
 * A viewer to display DataModel entities to the html page.
 */
function DataViewer() {

    "use strict";

}

/**
 * Display status text color-coded by level.
 * @param status: text to be displayed
 * @param level: one of "success", "info", "warning", "error". Default is
 * "info"
 */
DataViewer.prototype.displayStatus = function(status, level) {

    // Display the status
    $("#status").empty();

    switch (level) {
        case "success":
            cls = "success";
            break;
        case "info":
            cls = "info";
            break;
        case "warning":
            cls = "warning";
            break;
        case "error":
            cls = "danger";
            break;
        default:
            cls = "info";
            break;
    }

    status = "<div class=\"alert alert-" + cls + " alert-dismissable\">" +
        status + "</div>";
    $("#status").html(status);

};

/**
 * Display the data.
 * @param projects array of projects.
 */
DataViewer.prototype.displayProjects = function(data) {

    // Display the status
    $("#projects").empty();

    // Get the spaces
    var spaces = Object.keys(data);

    for (var i = 0; i < spaces.length; i++) {

        // Display the space
        var s = $("<div>").addClass("space").text(spaces[i]);
        $("#projects").append(s);

        // Display all its projects
        for (var j = 0; j < data[spaces[i]].length; j++) {

            var project = data[spaces[i]][j];

            var p = $("<div>").addClass("project").text(project.code).css('cursor', 'pointer').click(
                DATAVIEWER.retrieveProjectInfo(project));

            $("#projects").append(p);

        }

    }

};

/**
 * Retrieve the information for the requested project.
 * @param project A project
 */
DataViewer.prototype.retrieveProjectInfo = function(project) {

    return function() {
        DATAVIEWER.displayExperiments(project.code);
    }

};

/**
 * Display the data.
 * @param projects array of projects.
 */
DataViewer.prototype.displayExperiments = function(experiments) {

    // Display the status
    $("#experiments").empty();

    var p = $("<div>").addClass("experiment").text(experiments).css('cursor', 'pointer');
    $("#experiments").append(p);

};

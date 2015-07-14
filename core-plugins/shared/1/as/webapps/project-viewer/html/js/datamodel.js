/**
 * DataModel class
 * 
 * @author Aaron Ponti
 *
 */


/**
 * Define a model class to access all project related information.
 */
function DataModel() {

    "use strict";

    // Create a context object to access the context information
    this.context = new openbisWebAppContext();

    // Create an OpenBIS facade to call JSON RPC services
    this.openbisServer = new openbis("/openbis");
    
    // Reuse the current sessionId that we received in the context for
    // all the facade calls
    this.openbisServer.useSession(this.context.getSessionId());

    // Store the data
    this.data = [];

    // Retrieve all projects
    this.openbisServer.listProjects(function(response) {
        if (response.error) {

            // Make sure that the data property is empty
            DATAMODEL.data = [];

            // Report the error
            DATAVIEWER.displayStatus("Could not retrieve the list of projects!", "error");

        } else {

            // Build the data structure
            DATAMODEL.buildDataStructure(response.result);

        }
    })
}

/**
 * Build the data structure.
 * @param projects array of projects.
 */
DataModel.prototype.buildDataStructure = function(projects) {

    // Go over all projects and rearrange them per space
    for (var i = 0; i < projects.length; i++) {

        // Get the space code
        var spaceCode = projects[i].spaceCode;

        // Is the space already in the data array?
        if (! DATAMODEL.data.hasOwnProperty(spaceCode)) {
            DATAMODEL.data[spaceCode] = new Array();
        }

        // Add the project
        DATAMODEL.data[spaceCode].push(projects[i]);
    }

    // Now display the data
    DATAVIEWER.displayProjects(DATAMODEL.data);

};

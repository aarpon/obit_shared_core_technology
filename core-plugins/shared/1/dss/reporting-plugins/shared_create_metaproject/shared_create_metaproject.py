# -*- coding: utf-8 -*-

# Ingestion service: create a metaproject (tag) with user-defined name in given space

def process(transaction, parameters, tableBuilder):
    """Create a project with user-defined name in given space.
    """

    # Prepare the return table
    tableBuilder.addHeader("success")
    tableBuilder.addHeader("message")

    # Add a row for the results
    row = tableBuilder.addRow()

    # Retrieve parameters from client
    metaprojectCode = parameters.get("metaprojectCode")
    username = parameters.get("userName")

    # Try retrieving the metaproject (tag)
    metaproject = transaction.getMetaproject(metaprojectCode, username)

    if metaproject is None:

        # Create the metaproject (tag)
        metaproject = transaction.createNewMetaproject(metaprojectCode,
                                                       "Test",
                                                       username)

        # Check that creation was succcessful
        if metaproject is None:

            success = "false"
            message = "Could not create metaproject " + metaprojectCode + "."

        else:

            success = "true"
            message = "Tag " + metaprojectCode + " successfully created."

    else:

        success = "false"
        message = "Tag " + metaprojectCode + " exists already."

    # Add the results to current row
    row.setCell("success", success)
    row.setCell("message", message)

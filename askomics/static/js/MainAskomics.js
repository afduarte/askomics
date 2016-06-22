/*jshint esversion: 6 */

function startRequestSessionAskomics() {
  // Initialize the graph with the selected start point.
  $("#init").hide();
  $("#queryBuilder").show();
  d3.select("svg").remove();

  /* To manage construction of SPARQL Query */
  graphBuilder = new AskomicsGraphBuilder();
  /* To manage information about current node */
  nodeView = new AskomicsNodeView();
  /* To manage Attribute view on UI */
  attributesView = new AskomicsAttributesView();
  /* To manage Attribute view on UI */
  linksView = new AskomicsLinksView();
  /* To manage the D3.js Force Layout  */
  forceLayoutManager = new AskomicsForceLayoutManager();
  /* To manage information about User Datasrtucture  */
  userAbstraction = new AskomicsUserAbstraction();
}

function startVisualisation() {
    //Following code is automatically executed at start or is triggered by the action of the user
    startRequestSessionAskomics();
    forceLayoutManager.start();
}

function loadStartPoints() {

  var service = new RestServiceJs("startpoints");
  $("#btn-down").prop("disabled", true);
  $("#showNode").hide();
  $("#deleteNode").hide();

  service.getAll(function(startPointsDict) {
      $("#svgdiv").data({
        last_counter: startPointsDict.last_new_counter });

      $("#startpoints").empty();

      $.each(startPointsDict.nodes, function(key, value) {
          $("#startpoints").append($("<option></option>").attr("data-value", JSON.stringify(value)).text(value.label));
      });
      $("#starter").prop("disabled", true);
      $("#startpoints").click(function(){
          if ($("#starter").prop("disabled")) {
              $("#starter").prop("disabled", false);
          }
      });
  });
}

function loadStatistics(modal) {

  if (modal) {
    displayModal('Please Wait', 'Close');
  }

  var service = new RestServiceJs("statistics");
  service.getAll(function(stats) {
    $('#content_statistics').empty();
    $('#content_statistics')
    .append($("<p></p>").text("Number of triples  : "+stats.ntriples))
    .append($("<p></p>").text("Number of entities : "+stats.nentities))
    .append($("<p></p>").text("Number of classes : "+stats.nclasses))
    .append($("<div id='deleteButtons'></div>"));

    $("#deleteButtons").append("<p><button id='btn-empty' onclick='emptyDatabase(\"confirm\")' class='btn btn-danger'>Empty database</button></p>");

    table=$("<table></table>").addClass('table').addClass('table-bordered');
    th = $("<tr></tr>").addClass("table-bordered").attr("style", "text-align:center;");
    th.append($("<th></th>").text("Class"));
    th.append($("<th></th>").text("Nb"));
    table.append(th);

    $.each(stats['class'], function(key, value) {
      tr = $("<tr></tr>")
            .append($("<td></td>").text(key))
            .append($("<td></td>").text(value.count));
      table.append(tr);
    });
    $('#content_statistics').append(table);


    table=$("<table></table>").addClass('table').addClass('table-bordered');
    th = $("<tr></tr>").addClass("table-bordered").attr("style", "text-align:center;");
    th.append($("<th></th>").text("Class"));
    th.append($("<th></th>").text("Relations"));
    table.append(th);

    $.each(stats['class'], function(key, value) {
      tr = $("<tr></tr>")
            .append($("<td></td>").text(key));
            rels = "";
            $.each(value.relations, function(key_rel, value_rel) {
                rels += value_rel.source_id + " ----" + value_rel.relation_label + "----> " + value_rel.target_id + " ";
            });
            tr.append($("<td></td>").text(rels));
      table.append(tr);
    });
    $('#content_statistics').append(table);


    table = $("<table></table>").addClass('table').addClass('table-bordered');
    th = $("<tr></tr>").addClass("table-bordered").attr("style", "text-align:center;");
    th.append($("<th></th>").text("Class"));
    th.append($("<th></th>").text("Attributes"));
    table.append(th);

    $.each(stats['class'], function(key, value) {
      tr = $("<tr></tr>")
            .append($("<td></td>").text(key));
            attrs = "";
            $.each(value.attributes, function(key_attr, value_attr) {
                attrs += value_attr.label+", ";
            });
            tr.append($("<td></td>").text(attrs));
      table.append(tr);
    });

    if (modal) {
        hideModal();
    }

    $('#content_statistics').append(table);

  });
}

function emptyDatabase(value) {
    if (value == 'confirm') {
        $("#deleteButtons").empty();
        $("#deleteButtons")
        .append('<p>Delete all data ? ')
        .append("<button id='btn-empty' onclick='emptyDatabase(\"yes\")' class='btn btn-danger'>Yes</button> ")
        .append("<button id='btn-empty' onclick='emptyDatabase(\"no\")' class='btn btn-default'>No</button></p>");
        return;
    }

    if (value == 'no') {
        $("#deleteButtons").empty();
        $("#deleteButtons").append("<p><button id='btn-empty' onclick='emptyDatabase(\"confirm\")' class='btn btn-danger'>Clear database</button></p>");
        return;
    }

    if (value == 'yes') {
        displayModal('Please wait during deletion', 'Close');
        var service = new RestServiceJs("empty_database");
            service.getAll(function(empty_db){
            hideModal();
            loadStatistics(false);
        });
    }
}

var modalCount = 0;

function displayModal(message, button) {
    $('#modalMessage').text(message);
    $('#modalButton').text(button);
    $('#modal').modal('show');
    modalCount++;
}

function hideModal(){
    modalCount--;
    if (modalCount<=0) {
     $('#modal').modal('hide');
    }
}


function downloadTextAsFile(filename, text) {
    // Download text as file
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}


$(function () {
    // Startpoints definition
    loadStartPoints();

    // Loading a sparql query file
    $(".uploadBtn").change( function(event) {
      var uploadedFile = event.target.files[0];
      if (uploadedFile) {
          var fr = new FileReader();
          fr.onload = function(e) {
            var contents = e.target.result;
            startRequestSessionAskomics();
            forceLayoutManager.startWithQuery(contents);
          };
          fr.readAsText(uploadedFile);
      }
    });

    //$("#uploadedQuery")
    $("#btn-qdown").on('click', function(d) {
      window.location.href = "data:text/plain;charset=UTF-8," + encodeURIComponent(graphBuilder.getInternalState());
    });


    // Get the overview of files to integrate
    $("#integration").click(function() {
        var service = new RestServiceJs("up/");
        service.getAll(function(formHtmlforUploadFiles) {
          $('div#content_integration').html(formHtmlforUploadFiles.html);
        });
    });

    // Visual effect on active tab (Ask! / Integrate / Credits)
    $('.nav li').click(function(e) {
        $('.nav li.active').removeClass('active');
        var $this = $(this);
        if (!$this.hasClass('active')) {
            $this.addClass('active');
        }
        $('.container').hide();
        $('.container#navbar_content').show();
        $('.container#content_' + $this.attr('id')).show();
        e.preventDefault();
    });

    // A helper for handlebars
    Handlebars.registerHelper('nl2br', function(text) {
        var nl2br = (text + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + '<br>' + '$2');
        return new Handlebars.SafeString(nl2br);
    });
});
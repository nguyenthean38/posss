<?php
function read_docx($filename){
    $zip = new ZipArchive;
    $dataFile = 'word/document.xml';
    if (true === $zip->open($filename)) {
        if (($index = $zip->locateName($dataFile)) !== false) {
            $data = $zip->getFromIndex($index);
            $zip->close();
            $dom = new DOMDocument();
            $dom->loadXML($data, LIBXML_NOENT | LIBXML_XINCLUDE | LIBXML_NOERROR | LIBXML_NOWARNING);
            return strip_tags($dom->saveXML());
        }
        $zip->close();
    }
    return '';
}
file_put_contents('API_DOCS.txt', read_docx('API_DOCS.docx'));
file_put_contents('UseCase.txt', read_docx('UseCase_DacTa_POS.docx'));
echo "Done";
?>

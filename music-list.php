<?php
$dir = 'music';
$files = array_values(array_diff(scandir($dir), array('.', '..')));
$trackList = [];

foreach ($files as $file) {
    $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
    if (in_array($ext, ['mp3', 'wav', 'ogg', 'm4a', 'flac'])) {
        $trackList[] = [
            'title' => pathinfo($file, PATHINFO_FILENAME),
            'file'  => "$dir/$file",
            'art'   => 'default-art.jpg',
            'status'=> '' // You can update this later
        ];
    }
}

header('Content-Type: application/json');
echo json_encode($trackList);
?>

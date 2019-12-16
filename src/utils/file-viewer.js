export const FileViewer = (url, filename) => {
    const fileExtension = getFileExtensionByTitle(filename);

    switch (fileExtension) {
        case "png":
        case "jpg":
        case "jpeg":
        case "gif":
        case "pdf":
            return url;

        case "ppt":
        case "pptx":
        case "doc":
        case "docx":
        case "xls":
        case "xlsx":
            return `https://view.officeapps.live.com/op/embed.aspx?src=${decodeURIComponent(
                url
            )}`;
        default:
            return "not supported";
    }
};

const getFileExtensionByTitle = filename => {
    return !!filename
        ? filename
              .split(".")
              .pop()
              .toLowerCase()
        : null;
};

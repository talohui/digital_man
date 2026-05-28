package com.lingshan.analytics.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "lingshan")
public class LingshanPathsProperties {

    private Rag rag = new Rag();
    private Fay fay = new Fay();

    public Rag getRag() { return rag; }
    public void setRag(Rag rag) { this.rag = rag; }

    public Fay getFay() { return fay; }
    public void setFay(Fay fay) { this.fay = fay; }

    public static class Rag {
        private String rootDir = "../lingshan-rag";
        private String python = "python";

        public String getRootDir() { return rootDir; }
        public void setRootDir(String rootDir) { this.rootDir = rootDir; }

        public String getPython() { return python; }
        public void setPython(String python) { this.python = python; }
    }

    public static class Fay {
        private String configPath = "../数字人开源项目/Fay-main/config.json";

        public String getConfigPath() { return configPath; }
        public void setConfigPath(String configPath) { this.configPath = configPath; }
    }
}

package com.lingshan.analytics.service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import java.time.Duration;
import java.util.Map;
@Component public class RestKnowledgeBaseTransport implements KnowledgeBaseTransport {
 private final RestClient client;
 public RestKnowledgeBaseTransport(@Value("${lingshan.kb.base-url:http://127.0.0.1:5011}") String baseUrl){JdkClientHttpRequestFactory f=new JdkClientHttpRequestFactory();f.setReadTimeout(Duration.ofSeconds(2));client=RestClient.builder().baseUrl(baseUrl).requestFactory(f).build();}
 @SuppressWarnings("unchecked") public Map<String,Object> postFaq(Map<String,Object> body){return client.post().uri("/kb/faq").body(body).retrieve().body(Map.class);} public void updateFaq(String id,Map<String,Object> body){client.put().uri("/kb/faq/{id}",id).body(body).retrieve().toBodilessEntity();}
}
